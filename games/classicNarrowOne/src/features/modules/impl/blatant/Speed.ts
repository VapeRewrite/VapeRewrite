import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";
import Bus from "@/Bus";
import game from "@/utils/refs/game";
import getMovement from "@/utils/movement/getMoveDir";

export default class Speed extends Mod {
	public name = "Speed";
	public category = Category.BLATANT;

	readonly speedSetting = this.createSliderSetting("Speed", 10, 0.1, 100, 0.01);
	readonly jump = this.createToggleSetting("Jump");

	@Bus.Subscribe("gameTick")
	onTick(): void {
		const {player} = game;
		if (!player) return;
		const [x, z] = getMovement(this.speedSetting.value());
		player.rigidBody.velocity.x = x;
		player.rigidBody.velocity.z = z;
		if (this.jump.value() && player.rigidBody.isOnFloor) {
			player.onJumpPress();
		}
	}

	getTag(): string {
		return `Normal ${this.speedSetting.value().toFixed(2)}`;
	}
}
