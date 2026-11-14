/**
 * Manages rotation
 * @module
 */

import type { CancelableWrapper } from "@vape-rewrite/core";

import { Priority } from "@vape-rewrite/core";

import Bus from "@/Bus";
import type { PosData } from "@/events";
import { main } from "@/hooks/mainHook";

import game from "../refs/game";
import Rotation from "./rotation";
import THREE from "../refs/three";
import type { BufferGeometry, Line, LineBasicMaterial } from "three";

export class RotationPlan {
	constructor(
		public target: Rotation,
		public resetIn = 1,
	) {}
}

export default new (class RotationManager {
	#currentPlan: RotationPlan | undefined;
	#trackedRot = Rotation.ZERO;
	#tracer: Line<BufferGeometry, LineBasicMaterial>
 | null = null;
	#tracerGeo: BufferGeometry | null = null;

	constructor() {
		Bus.registerSubscriber(this);
	}
	get currentPlan() {
		return this.#currentPlan;
	}
	get playerRot() {
		return new Rotation(game.player.rotationYaw, game.player.rotationPitch);
	}
	get trackedRot() {
		return this.#trackedRot;
	}
	get serverRotation() {
		return /*packetQueueManager.serverRot ?? */ this.#trackedRot;
	}
	get activeRotation() {
		return this.#currentPlan?.target ?? this.playerRot;
	}
	scheduleRotation(plan: RotationPlan) {
		this.#currentPlan = plan;
	}

	@Bus.Subscribe("playerTick")
	private onTick() {
		const { currentPlan: plan } = this;
		if (!plan) {
			this.#removeTracer();
			return;
		}

		this.#ensureTracer();
		this.#updateTracer();
		plan.resetIn--;
		if (plan.resetIn <= 0) {
			this.#currentPlan = undefined;
			this.#removeTracer();
		}
	}

	@Bus.Subscribe("sendPos", Priority.LOWEST)
	private onPacket(wrap: CancelableWrapper<PosData>) {
		const { currentPlan: plan } = this;
		if (!plan) return;
		const { target } = plan;
		wrap.data.rot.x = target.yaw;
		wrap.data.rot.y = target.pitch;
	}

	#ensureTracer() {
		if (this.#tracer || !main?.scene) return;
		const geo = new THREE.BufferGeometry();
		geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
		const mat = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.9 });
		const tracer = new THREE.Line(geo, mat);
		tracer.frustumCulled = false;
		tracer.renderOrder = 999;
		this.#tracer = tracer;
		main.scene.add(this.#tracer);
		this.#tracerGeo = geo;
	}

	#updateTracer() {
		const plan = this.#currentPlan;
		const p = game.player as any;
		if (!plan || !p || !this.#tracerGeo?.attributes) return;
		const eye = p.getCamPos();
		if (!eye) return;

		const { yaw, pitch } = plan.target;
		const cp = Math.cos(pitch),
			sp = Math.sin(pitch);
		const sy = Math.sin(yaw),
			cy = Math.cos(yaw);
		// shoot convention = getShootDirection() (0,0,-1) base — matches the packet rot
		const d = { x: -sy * cp, y: sp, z: -cy * cp };
		const len = 60;

		const a = this.#tracerGeo.attributes.position.array;
		a[0] = eye.x;
		a[1] = eye.y;
		a[2] = eye.z;
		a[3] = eye.x + d.x * len;
		a[4] = eye.y + d.y * len;
		a[5] = eye.z + d.z * len;
		this.#tracerGeo.attributes.position.needsUpdate = true;
	}

	#removeTracer() {
		if (this.#tracer) {
			main.scene.remove(this.#tracer);
			this.#tracer = null;
			this.#tracerGeo = null;
		}
	}
})();
