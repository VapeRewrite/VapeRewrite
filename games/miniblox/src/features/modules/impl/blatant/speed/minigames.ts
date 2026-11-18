import type Speed from "./index";

import { CancelableWrapper } from "@vape-rewrite/core";
import { SubModule } from "@vape-rewrite/core";
import type { C2SPacket } from "@wq2/miniblox-sdk";

import { Priority, Subscribe } from "@/event/Bus";
import { isC2S } from "@/utils";
import Miniblox from "@/utils/refs/miniblox";

type SpoofedInput = C2SPacket & {
	jump: boolean;
	onGround: boolean;
	clone(): SpoofedInput;
};

const SPEED = 0.25;
const JUMP_HEIGHT = 0.25;

export default class Minigames extends SubModule<Speed> {
	#spoofJump = false;
	@Subscribe("playerTick")
	private onTick(): void {
		const { player } = Miniblox;
		if (!player.isSprinting()) return;
		player.motion.x *= 1.25;
		if (player.onGround) player.motion.y = JUMP_HEIGHT;
		player.motion.z *= 1.25;
		this.#spoofJump = true;
	}

	@Subscribe("sendPacket", Priority.HIGHEST)
	private onSendPacket(wrap: CancelableWrapper<C2SPacket>) {
		const input = wrap.data as SpoofedInput;
		if (isC2S("SPacketPlayerInput", input) && input.onGround) {
			const clone = input.clone();
			clone.jump = true;
			clone.onGround = true;
			wrap.data = clone;
			this.#spoofJump = false;
		}
	}

	onDisable(): void {
		const { player } = Miniblox;
		player.motion.x = Math.max(Math.min(player.motion.x, 0.3), -0.3);
		player.motion.z = Math.max(Math.min(player.motion.z, 0.3), -0.3);
	}

	getTag(): string {
		return "Minigames";
	}
}
