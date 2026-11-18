// TODO: support queueing S2C packets?

import type { Material, Mesh } from "three";

import { CancelableWrapper, Priority } from "@vape-rewrite/core";

import Refs from "@/hooks/game";
import type { AnyPacket } from "@/hooks/packetHook";
import { mod as protocol } from "@/utils/wrappers/protocol";
import { mod as THREE } from "@/utils/wrappers/three";

import Bus from "../../Bus";

import { sendSilently } from "./packetUtil";
import { SimpleVec3 } from "@vape-rewrite/core";
import getPosFromPacket from "./getPos";

export class PacketRecord<T> {
	constructor(
		public packet: T,
		public time: number,
	) {}
}

export enum Action {
	FLUSH,
	PASS,
	QUEUE,
}

export class PacketOutcome<P> {
	constructor(
		public packet: P,
		public action: Action,
	) {}
}

enum PreAction {
	PASS,
	FLUSH,
	GO,
}

export default new (class PacketQueueManager {
	private packetQueue: PacketRecord<AnyPacket>[] = [];
	#posBox?: Mesh;

	constructor() {
		Bus.registerSubscriber(this);
	}

	get serverPos(): SimpleVec3 | undefined {
		return getPosFromPacket(
			this.packetQueue.find((p) => getPosFromPacket(p.packet) !== undefined)?.packet,
		);
	}

	get lagging() {
		return this.packetQueue.length > 0;
	}

	/**
	 * @returns `Date.now() - this.packetQueue[0].time`, or `0` if `this.lagging` is false.
	 */
	laggingFor(filter?: (pkt: PacketRecord<AnyPacket>) => boolean): number {
		if (!this.lagging) return 0;
		const item =
			filter !== undefined ? this.packetQueue.find((a) => filter(a)) : this.packetQueue[0];
		if (item === undefined) return 0;
		return Date.now() - item.time;
	}

	/** this doesn't remove the packet from the packet queue since I'm lazy, you do that yourself. this just sends the packet. */
	private flushPacket<T extends AnyPacket>(record: PacketRecord<T>) {
		// TODO: only handling C2S packets
		sendSilently(record.packet);
	}

	flush(when?: (p: PacketRecord<AnyPacket>) => boolean) {
		this.packetQueue = this.packetQueue.filter((p) => {
			const result = when?.(p) ?? true;

			if (result) this.flushPacket(p);

			return !result;
		});
	}

	#preProcessing(pkt: AnyPacket): PreAction {
		switch (pkt[0]) {
			case protocol.PACKET.CHAT:
				return PreAction.PASS;
			case protocol.PACKET.RESPAWN:
				return PreAction.FLUSH;
			case protocol.PACKET.DISCONNECT:
				return PreAction.FLUSH;
			default:
				return PreAction.GO;
		}
	}

	@Bus.Subscribe("sendPacket", Priority.FINAL_DECISION)
	private onPacket(e: CancelableWrapper<AnyPacket>) {
		if (e.canceled) return;
		switch (this.#preProcessing(e.data)) {
			case PreAction.PASS:
				return;
			case PreAction.FLUSH:
				this.flush();
				return;
			case PreAction.GO:
				break;
		}

		const outcome = new PacketOutcome(e.data, Action.FLUSH);

		Bus.emit("queueC2SPacket", outcome);

		if (outcome.action === Action.FLUSH) this.flush();

		if (outcome.action === Action.QUEUE) {
			this.packetQueue.push(new PacketRecord(outcome.packet, Date.now()));
			e.cancel();
		}
	}

	#hidePosBox() {
		if (!this.#posBox?.visible) return;
		this.#posBox.visible = false;
	}

	#updatePosBox() {
		if (!this.lagging) return;
		if (!this.serverPos) return;
		if (!this.#posBox) {
			this.#initPosBox();
		}
		this.#posBox.visible = true;
		this.#posBox.position.set(this.serverPos.x, this.serverPos.y + 1, this.serverPos.z);
	}

	#initPosBox() {
		const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, Refs.player.height, 1));
		this.#posBox = mesh;
		const mtr = mesh.material as Material;
		mtr.depthTest = false;
		mtr.transparent = true;
		mtr.opacity = 0.5;
		mesh.renderOrder = 6;
		mesh.visible = true;
		Refs.game.renderer.scene.add(mesh);
		return mesh;
	}

	@Bus.Subscribe("gameTick")
	private onRender() {
		if (!this.lagging) {
			this.#hidePosBox();
			return;
		}
		const sPos = this.serverPos;
		if (!sPos) {
			this.#hidePosBox();
			return;
		}
		if (!this.#posBox) this.#initPosBox();
		this.#updatePosBox();
	}
})();
