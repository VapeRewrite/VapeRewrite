import type Speed from "./index";
import type { SliderSetting } from "@vape-rewrite/core";

import { SubModule } from "@vape-rewrite/core";

import { Subscribe } from "@/event/Bus";
import getMoveDirection from "@/utils/movement/movement";
import Miniblox from "@/utils/refs/miniblox";

export default class Normal extends SubModule<Speed> {
	readonly #speedSetting = this.createSliderSetting("Speed", 1, 0.11, 6.0, 0.01);
	readonly #jumpSetting = this.createToggleSetting("Jump", false);

	get #speed() {
		return this.#speedSetting.value();
	}

	get #jump() {
		return this.#jumpSetting.value();
	}

	@Subscribe("playerTick")
	onTick(): void {
		const { player } = Miniblox;
		const dir = getMoveDirection(this.#speed);

		player.motion.x = dir.x;
		player.motion.z = dir.z;
		if (this.#jump && player.onGround) {
			player.jump();
		}
	}

	onDisable(): void {
		const { player } = Miniblox;
		player.motion.x = Math.max(Math.min(player.motion.x, 0.3), -0.3);
		player.motion.z = Math.max(Math.min(player.motion.z, 0.3), -0.3);
	}

	getTag(): string {
		return `Normal ${this.#speedSetting.value().toFixed(2)}`;
	}
}
