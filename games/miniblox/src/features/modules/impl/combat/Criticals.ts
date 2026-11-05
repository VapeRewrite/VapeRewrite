import type { CancelableWrapper } from "@vape-rewrite/core";
import type { C2SPacket } from "@wq2/miniblox-sdk";

import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";

import { Subscribe } from "@/event/Bus";
import { isC2S } from "@/utils";
import { c2s } from "@/utils/network/packetRefs";
import Miniblox from "@/utils/refs/miniblox";

/** Y offset values, that when used before attacking a player, gives a critical hit. **/
const CRIT_OFFSETS = [0.08, -0.07840000152];

export default class Criticals extends Mod {
	public name = "Criticals";
	public category = Category.COMBAT;

	static sendCritPackets() {
		const { ClientSocket, player } = Miniblox;
		const SPacketPlayerPosLook = c2s("SPacketPlayerPosLook");
		if (!SPacketPlayerPosLook) return;
		for (const offset of CRIT_OFFSETS) {
			const pos = {
				x: player.pos.x,
				y: player.pos.y + offset,
				z: player.pos.z,
			};
			ClientSocket.sendPacket(
				new SPacketPlayerPosLook({
					pos,
					onGround: false,
				}),
			);
		}
	}

	@Subscribe("sendPacket")
	private onPacket({ data: pkt }: CancelableWrapper<C2SPacket>) {
		if (isC2S("SPacketUseEntity", pkt) && pkt.action === 1 /*ATTACK*/) Criticals.sendCritPackets();
	}
}
