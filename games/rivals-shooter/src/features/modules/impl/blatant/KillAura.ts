import { Category, Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import Refs from "@/utils/refs/game";

export default class KillAura extends Mod {
	name = "KillAura";
	category = Category.BLATANT;
	@Bus.Subscribe("gameTick")
	private onTick() {
		const { game } = Refs;
		if (!game) return;
		// TODO: bother with implementing ts 
		// for (const enemies of game.enemyBots) {
		// }
	}
}
