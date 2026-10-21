import type { C2SPacket, SPacketPlayerInput, SPacketPlayerPosLook } from "@wq2/miniblox-sdk";

import { SimpleVec3 } from "@vape-rewrite/core";

import { isC2S } from "./PacketUtil";

export default function getPosFromPacket(packet: SPacketPlayerPosLook): SimpleVec3 | undefined; // doesn't always have the position in it
export default function getPosFromPacket(packet: SPacketPlayerInput): SimpleVec3; // not optional
export default function getPosFromPacket(
	packet: SPacketPlayerPosLook | undefined,
): SimpleVec3 | undefined; // doesn't always have the position in it
export default function getPosFromPacket(packet: SPacketPlayerInput | undefined): SimpleVec3; // not optional
export default function getPosFromPacket(packet: C2SPacket | undefined): SimpleVec3 | undefined;
export default function getPosFromPacket(packet: C2SPacket | undefined): SimpleVec3 | undefined {
	if (isC2S("SPacketPlayerPosLook", packet) && packet.pos) {
		return SimpleVec3.fromVec3Like(packet.pos);
	}
	if (isC2S("SPacketPlayerInput", packet)) {
		return SimpleVec3.fromVec3Like(packet.pos);
	}
}
