import { CancelableWrapper, expose } from "@vape-rewrite/core";
import { showNotification } from "@vape-rewrite/ui-api";
import { createProxy } from "@vape-rewrite/core";

import Bus from "@/Bus";
import game, { anyReady } from "@/utils/refs/game";
import gameRefs from "@/utils/refs/game";

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
/** this needs to be called when `main` is available */
export function hookBackgroundGameTick() {
	const { gameManager } = gameRefs;
	const {
		fireCurrentGameChangeCbs: oFire,
		destroyCurrentGame: oDestroy,
		activeGame: oGame,
	} = gameManager;
	function loadBackgroundGame() {
		gameManager.destroyCurrentGame = createProxy(oDestroy, {
			apply() {},
		});
		gameManager.fireCurrentGameChangeCbs = createProxy(oFire, {
			apply() {},
		});
		gameManager.loadOfflineRoamingGame();
	}
	function reset() {
		gameManager.destroyCurrentGame = oDestroy;
		gameManager.destroyCurrentGame();
		gameManager.fireCurrentGameChangeCbs = oFire;
		gameManager.activeGame = oGame;
	}
	const shouldLoadBackgroundGame = !oGame.gameStarted;
	if (shouldLoadBackgroundGame) loadBackgroundGame();
	hookGameTick(true);
	if (shouldLoadBackgroundGame) reset();
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

anyReady.then(() => {
	hookGameTick();
	hookPlayerTick();
});
mainReady.then(hookBackgroundGameTick);
expose("hookGameTick", () => hookGameTick);
expose("hookPlayerTick", () => hookPlayerTick);
