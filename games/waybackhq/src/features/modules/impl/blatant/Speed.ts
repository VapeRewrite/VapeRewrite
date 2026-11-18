import type { SliderSetting } from "@vape-rewrite/core";
import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import Refs from "@/hooks/game";
import { getMoveDir } from "@/utils/movement";

export default class Speed extends Mod {
	public name = "Speed";
	public category = Category.BLATANT;

	private readonly speedSetting: SliderSetting = this.createSliderSetting(
		"Speed",
		1,
		0.11,
		6.0,
		0.01,
	);
	private readonly jump = this.createToggleSetting("Jump");

	@Bus.Subscribe("playerTick")
	onTick(): void {
		const {
			game: { localPlayer },
		} = Refs;
		const dir = getMoveDir(this.speedSetting.value());
		const [x, z] = dir;

		if (localPlayer.onGround && this.jump.value()) localPlayer.jump();
		localPlayer.motionX = x;
		localPlayer.motionZ = z;
	}

	onDisable(): void {
		const {
			game: { localPlayer },
		} = Refs;
		localPlayer.motionX = Math.max(Math.min(localPlayer.motionX, 0.3), -0.3);
		localPlayer.motionZ = Math.max(Math.min(localPlayer.motionZ, 0.3), -0.3);
	}

	getTag(): string {
		return this.speedSetting.value().toFixed(2);
	}
}
