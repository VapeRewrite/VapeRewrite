import { Category, Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import Refs from "@/utils/refs/game";
import meleeHit from "@/utils/attack";
export default class KillAura extends Mod {
	name = "KillAura";
	category = Category.BLATANT;
	@Bus.Subscribe("preTick")
	private onTick() {
		const { game } = Refs;
		const entities = game.listEntities();
		for (const entity of entities) {
			meleeHit(entity.id);
		}
	}
}
