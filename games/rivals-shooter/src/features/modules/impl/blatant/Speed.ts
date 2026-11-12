import type { PhysicsTickData } from "@/events";
import { Category, Mod } from "@vape-rewrite/core";
import Bus from "@/Bus";
import gameRefs from "@/utils/refs/game";
// import Refs from "@/utils/refs/game";

export default class Speed extends Mod {
	name = "Speed";
	category = Category.BLATANT;
	#speedSetting = this.createSliderSetting("Speed", 15, 2, 100);

	get #speed() {
		return this.#speedSetting.value();
	}

	@Bus.Subscribe("postPhysicsTick")
	private onMove({ moveDir }: PhysicsTickData) {
		const { player } = gameRefs;
		const modified = moveDir.clone().multiplyScalar(this.#speed);
		player.velocity.setX(modified.x).setZ(modified.z);
	}
}
