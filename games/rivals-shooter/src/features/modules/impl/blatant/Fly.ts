import type { PhysicsTickData } from "@/events";

import { Category, Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import isKeyDown from "@/utils/input/key";
import Refs from "@/utils/refs/game";

export default class Fly extends Mod {
	name = "Fly";
	category = Category.BLATANT;
	#speedSetting = this.createSliderSetting("Speed", 15, 1, 100, 1);
	#verticalSpeedSetting = this.createSliderSetting("VerticalSpeed", 5, 1, 100, 1);

	get #speed() {
		return this.#speedSetting.value();
	}

	get #verticalSpeed() {
		return this.#verticalSpeedSetting.value();
	}

	@Bus.Subscribe("postPhysicsTick")
	private onTick({ moveDir }: PhysicsTickData) {
		const { player } = Refs;
		const [up, down] = ["Space", "ShiftLeft"].map(isKeyDown);
		const y = up ? this.#verticalSpeed : down ? -this.#verticalSpeed : 0;
		const modified = moveDir.clone().multiplyScalar(this.#speed);
		modified.y = y;
		player.velocity = modified;
	}
}
