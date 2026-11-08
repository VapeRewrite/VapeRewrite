/**
 * CTF AutoWin module.
 * @module
 */
import type { Vector3 } from "three";

import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";
import { CancelableWrapper } from "@vape-rewrite/core";
import { showNotification } from "@vape-rewrite/ui-api";
import type { Flag, Player } from "@wq2/narrow-one-types";
import Bus from "@/Bus";
import type { FlagChange, ServerMove, SpawnData } from "@/events";
import { FlagChangeType } from "@/events";
import gameRefs from "@/utils/refs/game";
import THREE from "@/utils/refs/three";

const enum State {
	Idle,
	GrabbingEnemyFlag,
	ReturnToBase,
	WaitingForRespawn,
	ReturnedToBase,
	CapturingFlag,
}

function lerpTo(start: Vector3, destination: Vector3, range: number) {
	const moveVec = new THREE.Vec3().subVectors(destination, start);
	const distance = moveVec.length();

	if (distance === 0) {
		return [new THREE.Vec3(0, 0, 0)];
	}

	const steps = Math.ceil(distance / range);
	const path = [];

	for (let i = 1; i <= steps; i++) {
		const t = i / steps;
		const current = new THREE.Vec3().lerpVectors(start, destination, t);
		const previous = new THREE.Vec3().lerpVectors(start, destination, (i - 1) / steps);

		path.push(current.sub(previous));
	}

	return path;
}

export default class AutoWin extends Mod {
	name = "AutoWin";
	category = Category.UTILITY;

	#state = State.Idle;
	#targetFlag: Flag | null = null;
	#movePath: Vector3[] = [];
	#grabRequested = false;
	#captureRequested = false;
	#networkWarningShown = false;
	#moving = false;
	#lastMove = -1;

	/** Maximum distance allowed for a flag action. */
	#maxDistanceSetting = this.createSliderSetting("MaxDistance", 1.5, 1.5, 2.5, 0.01);

	/** Maximum distance between consecutive movement points. */
	#speedSetting = this.createSliderSetting("Speed", 5, 2, 15, 0.1);

	get #maxDistance() {
		return this.#maxDistanceSetting.value();
	}

	get #speed() {
		return this.#speedSetting.value();
	}

	#notify(message: string, type: "info" | "warning" | "alert" = "info") {
		showNotification("AutoWin", message, type, 500);
	}

	#reset() {
		this.#state = State.Idle;
		this.#targetFlag = null;
		this.#movePath = [];
		this.#grabRequested = false;
		this.#captureRequested = false;
		this.#networkWarningShown = false;
		if (gameRefs.player)
			gameRefs.player.rigidBody.noclip = false;
	}

	#findTargetFlag(): Flag | null {
		const { player, onlineInstance: instance } = gameRefs;

		if (!instance || player.holdingFlag) return null;

		for (const flag of instance.getEnemyFlags(player.teamId)) {
			if (flag.currentHoldingPlayer || flag.holdingHandler) continue;
			return flag;
		}

		return null;
	}

	#moveTo(destination: Vector3, from?: Vector3) {
		const { player } = gameRefs;

		this.#movePath = lerpTo(from ?? player.pos, destination, this.#speed);
		this.#moving = false;
	}

	#getMovementDestination(): Vector3 | null {
		if (!this.#targetFlag) return null;

		switch (this.#state) {
			case State.GrabbingEnemyFlag:
				return this.#targetFlag.position;

			case State.CapturingFlag:
				return this.#targetFlag.defaultPosition;

			default:
				return null;
		}
	}

	#recalculatePath(position: Vector3) {
		const destination = this.#getMovementDestination();

		if (!destination) {
			this.#movePath = [];
			return this.#moving = false;
		}

		this.#moveTo(destination, position);
	}

	@Bus.Subscribe("receivedSpawn")
	private onReceivedSpawn(spawn: SpawnData) {
		if (this.#state !== State.WaitingForRespawn) return;
		if (!spawn.player.hasOwnership) return;

		this.#state = State.ReturnedToBase;
		this.#movePath = [];
	}

	@Bus.Subscribe("flagChange")
	private onFlagChange({ player, type }: FlagChange) {
		if (!player.hasOwnership) return;

		switch (type) {
			case FlagChangeType.GRAB:
				this.#state = State.ReturnToBase;
				this.#movePath = [];
				this.#grabRequested = false;
				return;

			case FlagChangeType.DROP:
				this.#reset();
				return;

			case FlagChangeType.CAPTURE:
				this.#reset();
				return;
			case FlagChangeType.RETURN:
				return;
		}
	}

	@Bus.Subscribe("preStepVelocity")
	private onStepVelocity() {
		const {player} = gameRefs;
		if (!player) return this.#moving = false;
		const moving = this.#tickMovement();
		if (moving)
			player.rigidBody.noclip = true;
		this.#moving = moving;
	}

	@Bus.Subscribe("postStepVelocity")
	private afterStepVelocity() {
		const {player} = gameRefs;
		if (!player) return this.#moving = false;
		const now = performance.now();
		const diff = now - this.#lastMove;
		if (!this.#moving && this.#movePath.length <= 0 && diff > 9) {
			player.rigidBody.noclip = false;
		}
	}

	@Bus.Subscribe("serverMove")
	private onServerMove({ data }: CancelableWrapper<ServerMove>) {
		if (!data.player.hasOwnership || !data.setback) return;

		const destination = this.#getMovementDestination();
		if (!destination) return;

		this.#notify("Setback detected; recalculating path.", "warning");

		this.#recalculatePath(new THREE.Vec3(...data.pos));
	}

	#tickMovement(): boolean {
		if (this.#movePath.length === 0) return false;
		const nextVelocity = this.#movePath.shift();
		if (!nextVelocity) return false;

		gameRefs.player.rigidBody.velocity.copy(nextVelocity);
		this.#lastMove = performance.now();

		return true;
	}

	#grabEnemyFlag() {
		const { player } = gameRefs;
		const flag = this.#targetFlag;

		if (player.holdingFlag) {
			this.#state = State.ReturnToBase;
			return this.#moving = false;
		}

		if (!flag || flag.holdingHandler || flag.currentHoldingPlayer) {
			this.#reset();
			return this.#moving = false;
		}

		if (this.#grabRequested) return this.#moving = false;

		if (player.pos.distanceTo(flag.position) > this.#maxDistance) {
			this.#moveTo(flag.position);
			return this.#moving = false;
		}

		player.sendChangeFlag(flag.id, 0);
		this.#grabRequested = true;
		this.#state = State.ReturnToBase;
		this.#notify("Grabbing enemy flag.");
	}

	#returnToBase() {
		const { player, network } = gameRefs;

		if (!player.holdingFlag) {
			return;
		}

		if (!network) {
			if (!this.#networkWarningShown) {
				this.#notify("Missing network access; cannot request respawn.", "alert");
				this.#networkWarningShown = true;
			}
			return;
		}

		player.sendPerformAction((player.constructor as unknown as typeof Player).PlayerAction.SPAWN);
		network.sendRequestRespawn(player.id);

		this.#state = State.WaitingForRespawn;
		this.#movePath = [];
	}

	#prepareCapture() {
		const { player, onlineInstance: instance } = gameRefs;

		if (!instance) return;

		const [myFlag] = instance.getMyFlags(player.teamId).toArray();
		if (!myFlag) return;

		if (!player.holdingFlag) {
			this.#reset();
			return;
		}

		this.#targetFlag = myFlag;
		this.#captureRequested = false;
		this.#moveTo(myFlag.defaultPosition);
		this.#state = State.CapturingFlag;
	}

	#captureFlag() {
		const { player } = gameRefs;
		const flag = this.#targetFlag ?? player.holdingFlag;

		if (!flag) {
			this.#reset();
			return;
		}

		if (this.#captureRequested) return;

		if (player.pos.distanceTo(flag.defaultPosition) > this.#maxDistance) {
			this.#moveTo(flag.defaultPosition);
			return;
		}

		player.sendChangeFlag(player.holdingFlag.id, 1);
		this.#captureRequested = true;
	}

	@Bus.Subscribe("playerTick")
	private onTick() {
		const { onlineInstance: instance } = gameRefs;

		if (!instance || !instance.gameStarted || instance.gameEnded) return;

		if (this.#state === State.GrabbingEnemyFlag && this.#targetFlag.currentHoldingPlayer)
			this.#reset();

		if (this.#moving) return;

		switch (this.#state) {
			case State.Idle: {
				if (gameRefs.player.holdingFlag) return this.#state = State.ReturnToBase;
				const target = this.#findTargetFlag();
				if (!target) return;

				this.#targetFlag = target;
				this.#grabRequested = false;
				this.#moveTo(target.position);
				this.#state = State.GrabbingEnemyFlag;
				break;
			}

			case State.GrabbingEnemyFlag:
				this.#grabEnemyFlag();
				break;

			case State.ReturnToBase:
				this.#returnToBase();
				break;

			case State.WaitingForRespawn:
				break;

			case State.ReturnedToBase:
				this.#prepareCapture();
				break;

			case State.CapturingFlag:
				this.#captureFlag();
				break;
		}
	}

	protected onDisable(): void {
		this.#reset();
	}
}
