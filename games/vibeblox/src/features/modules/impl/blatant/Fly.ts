import { Category, Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import Refs from "@/utils/refs/game";
import three from "@/utils/refs/three";

export default class Fly extends Mod {
	name = "Fly";
	category = Category.BLATANT;
	#fly() {
		const { game, script } = Refs;
		if (!game) return;
		script.launch(0, 25 * three.lastDelta, 0);
	}
	@Bus.Subscribe("preTick")
	@Bus.Subscribe("postTick")
	private onTick() {
		this.#fly();
	}
}
