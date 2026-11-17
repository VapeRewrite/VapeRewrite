import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import gameRefs from "@/utils/refs/game";

export default class ClientCrasher extends Mod {
	public name = "ClientCrasher";
	public category = Category.BLATANT;

	constructor() {
		super();
		setTimeout(() => {
			this.bind = "C";
		}, 0.1e3);
	}

	// readonly #speedSetting = this.createSliderSetting("Speed", 10, 0.1, 100, 0.01);
	readonly #verticalSpeedSetting = this.createSliderSetting("VerticalSpeed", 10, 0.1, 100, 0.1);

	get #speed() {
		return this.#speed.value();
	}

	get #verticalSpeed() {
		return this.#verticalSpeedSetting.value();
	}

	@Bus.Subscribe("playerTick")
	onPreStepVelocity() {
		const player = gameRefs.player; // active Ui instance
		// yes. this is it. the impossible crasher of The Pit.
		for (let i = 0; i < 50e3; i++) {
			player.Vo.th({ type: "jump" });
		}
	}

	getTag(): string {
		return `Normal`;
	}
}
