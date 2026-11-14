import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import gameRefs from "@/utils/refs/game";

export default class Fly extends Mod {
	public name = "Fly";
	public category = Category.BLATANT;

	// readonly #speedSetting = this.createSliderSetting("Speed", 10, 0.1, 100, 0.01);
	readonly #verticalSpeedSetting = this.createSliderSetting("VerticalSpeed", 10, 0.1, 100, 0.1);

	get #speed() {
		return this.#speed.value();
	}

	get #verticalSpeed() {
		return this.#verticalSpeedSetting.value();
	}

	@Bus.Subscribe("preStepVelocity")
	onPreStepVelocity() {
		const player = gameRefs.player; // active Ui instance
		const vSpeed = this.#verticalSpeed;
		let yVelocity = 0;
		// TODO
		const [up, down] = [false, false];
		if (up && !down) {
			yVelocity = vSpeed;
		} else if (down && !up) {
			yVelocity = -vSpeed;
		}
		const vel = player.Vo.wh;
		vel.y = yVelocity;
		player.Vo.Kh(vel); // V is the Vector3 class from the engine
	}

	getTag(): string {
		return `Normal`;
	}
}
