import type { C2SPacket, Entity } from "@wq2/miniblox-sdk";

import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";
import { SimpleVec3 } from "@vape-rewrite/core";
import { getRandomArbitrary } from "@vape-rewrite/core";

import { Subscribe } from "@/event/Bus";
import { isC2S } from "@/utils";
import { findTargets } from "@/utils/movement/target";
import packetQueueManager, { Action, type PacketOutcome } from "@/utils/network/packetQueueManager";
import Miniblox from "@/utils/refs/miniblox";

export default class FakeLag extends Mod {
	public name = "FakeLag";
	// you can config FakeLag to be legit-looking.
	public category = Category.UTILITY;
	#targetsInRange: Entity[] = [];
	#enemyNearby = false;

	#rng = this.createSliderSetting("Range", 12, 1, 18, 0.1);
	#miD = this.createSliderSetting("MinDelayMS", 999, 0, 9e3, 1.5);
	#maD = this.createSliderSetting("MaxDelayMS", 999, 1, 9e3, 1.5);
	#fOA = this.createToggleSetting("FlushOnAction", true);

	get #range() {
		return this.#rng.value();
	}

	get #minDelay() {
		return this.#miD.value();
	}

	get #maxDelay() {
		return this.#maD.value();
	}

	get #flushOnAction() {
		return this.#fOA.value();
	}

	get #delay() {
		return getRandomArbitrary(this.#minDelay, this.#maxDelay);
	}

	protected onDisable(): void {
		this.#enemyNearby = false;
		this.#targetsInRange = [];
	}

	#flushPreconditions(packet: C2SPacket): boolean {
		if (this.#flushOnAction) {
			return (
				(isC2S("SPacketEntityAction", packet) && packet.id === Miniblox.player.id) ||
				isC2S("SPacketUseEntity", packet) ||
				isC2S("SPacketUseItem", packet) ||
				isC2S("SPacketPlayerAction", packet) ||
				isC2S("SPacketUpdateSign", packet)
			);
		}

		return false;
	}

	@Subscribe("playerTick")
	private onTick() {
		this.#targetsInRange = findTargets(this.#range);
		this.#enemyNearby = this.#targetsInRange.length !== 0;
	}

	@Subscribe("queueC2SPacket")
	private handleQueue(outcome: PacketOutcome<C2SPacket>) {
		if (!this.#enemyNearby) return;

		if (packetQueueManager.laggingFor() > this.#delay || this.#flushPreconditions(outcome.packet)) {
			outcome.action = Action.FLUSH;
			return;
		}

		const targets = this.#targetsInRange;

		// no opps
		if (targets.length === 0) return;

		const anyIntersects = targets.find((t) =>
			t.boundingBox.intersectsBox(Miniblox.player.boundingBox),
		);

		if (anyIntersects) return;

		const svPos = packetQueueManager.serverPos; // CAN BE UNDEFINED
		const playerPos = Miniblox.player.pos;
		const srvPos = svPos
			? SimpleVec3.fromVec3Like(svPos)
			: SimpleVec3.fromVec3Like(playerPos);
		const serverPos = playerPos.clone().setX(srvPos.x).setY(srvPos.y).setZ(srvPos.z);

		const serverDistance = Math.min(...targets.map((e) => e.pos.distanceTo(serverPos)));

		const clientDistance = Math.min(...targets.map((e) => e.pos.distanceTo(playerPos)));

		if (serverDistance < clientDistance) {
			return;
		}

		outcome.action = Action.QUEUE;
	}
}
