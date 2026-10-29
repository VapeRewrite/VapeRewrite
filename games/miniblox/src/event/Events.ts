import type { Cancelable } from "@vape-rewrite/core";
import type { CancelableWrapper } from "@vape-rewrite/core";
import type { PacketOutcome } from "@/utils/network/packetQueueManager";
import type { C2SPacket, S2CPacket } from "@wq2/miniblox-sdk";

import type { CPacketName } from "@/utils";

/**
 * Used because network decoding (S -> C) is now done in a worker.
 * This means that it passes through `postMessage` and `structuredClone`,
 * removing the `prototype` data, which means it appears as a plain object.
 * Why a class? because then I can just do `instanceof`.
 * I'm not forcing the game to use `pumpInline` just because of ts.
 */
export class S2CData<P extends S2CPacket = S2CPacket, N extends CPacketName = CPacketName> {
	constructor(
		public name: N,
		public packet: P,
	) {}
}

type ClientEvents = {
	gameTick: void;
	playerTick: Cancelable;
	render: void;
	sendPacket: CancelableWrapper<C2SPacket>;
	receivePacket: CancelableWrapper<S2CData>;
	queueC2SPacket: PacketOutcome<C2SPacket>;
	connect: void;
};

export default ClientEvents;
