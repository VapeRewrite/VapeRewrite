import { Category, Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import Refs from "@/utils/refs/game";
import three from "@/utils/refs/three";
import isKeyDown from "@/utils/key";

const GRAVITY = 25;

export default class Fly extends Mod {
	name = "Fly";
	category = Category.BLATANT;
	#verticalSpeedSetting = this.createSliderSetting("VerticalSpeed", 5, 1, 100, 1);

	get #verticalSpeed() {
		return this.#verticalSpeedSetting.value();
	}

	#fly() {
		const { game, script } = Refs;
		if (!game) return;
		const [up, down] = ["Space", "ShiftLeft"].map(isKeyDown);
		const vSpeed = this.#verticalSpeed;
		const adjustedVSpeed = GRAVITY * vSpeed;
		const yV = up ? adjustedVSpeed : down ? -adjustedVSpeed : 25;
		const adjusted = yV * (three.lastDelta + 0.011);
		script.launch(0, adjusted, 0);
	}
	@Bus.Subscribe("preTick")
	@Bus.Subscribe("postTick")
	private onTick() {
		this.#fly();
	}
}
