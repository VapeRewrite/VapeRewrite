import { CancelableWrapper, delay, expose } from "@vape-rewrite/core";
import { showNotification } from "@vape-rewrite/ui-api";
import { createProxy } from "@vape-rewrite/core";

import Bus from "@/Bus";
import game, { anyReady } from "@/utils/refs/game";

import { ready as mainReady } from "./mainHook";
import type { Player } from "@wq2/narrow-one-types";

let origGameLoop, origBackgroundGameLoop, origPlayerLoop;

export default function hookGameTick(background = false) {
	const prototype = Object.getPrototypeOf(game.instance);
	// hooking the prototype instead,
	// so we hook every new game's loop function along with the current one.
	if (background) origBackgroundGameLoop = prototype.loop;
	else origGameLoop = prototype.loop;
	prototype.loop = createProxy(background ? origBackgroundGameLoop : origGameLoop, {
		apply(target, thisArg, argArray) {
			Bus.emit("gameTick");
			return Reflect.apply(target, thisArg, argArray);
		},
	});
}
export function hookPlayerTick() {
	if (!game.player) {
		showNotification("Hooks", "player missing, can't hook player tick", "alert", 1.5e3);
		return;
	}
	const prototype = Object.getPrototypeOf(game.player);
	origPlayerLoop = prototype.loop;
	prototype.loop = createProxy(origPlayerLoop, {
		apply(target, thisArg: Player, argArray: [now: number, dt: number]) {
			if (!thisArg.hasOwnership) return Reflect.apply(target, thisArg, argArray);
			const c = new CancelableWrapper({
				now: argArray[0],
				dt: argArray[1]
			});
			Bus.emit("playerTick", c);
			if (!c.canceled) return Reflect.apply(target, thisArg, argArray);
		},
	});
}

anyReady.then(async () => await delay(1e3)).then(() => {
	// hookGameTick();
	hookPlayerTick();
});
expose("hookGameTick", () => hookGameTick);
expose("hookPlayerTick", () => hookPlayerTick);
