import type { Bot } from "@wq2/rivals-shooter-types/src/ai/Bot";
import type { Input } from "@wq2/rivals-shooter-types/src/core/Input";
import type { Player } from "@wq2/rivals-shooter-types/src/player/Player";

import { Category, createProxy, Mod } from "@vape-rewrite/core";

import gameRefs, {ready as gameReady} from "@/utils/refs/game";
import { mod, type AimAssist, ready } from "@/utils/wrappers/player/AimAssist";

export default class AimAssistMod extends Mod {
	name = "AimAssist";
	category = Category.COMBAT;

	protected async onEnable() {
		await gameReady;
		await ready;
		const { game } = gameRefs;
		const aa = new mod.AimAssist(game.map);
		aa.update = createProxy(aa.update, {
			apply(
				target,
				thisArg: AimAssist,
				argArray: [dt: number, player: Player, input: Input, enemies: Bot[], now: number],
			) {
				const [, , input] = argArray;
				const {touch, touch: {fire, aim, moveX, moveY}} = input;
				touch.fire = input.fireHeld || input.firePressed;
				touch.aim = true;
				touch.moveX = 0.101;
				touch.moveY = 0.101;
				const res = Reflect.apply(target, thisArg, argArray);
				touch.fire = fire;
				touch.aim = aim;
				touch.moveX = moveX;
				touch.moveY = moveY;
				return res;
			},
		});
		game.aimAssist = aa;
	}
}
