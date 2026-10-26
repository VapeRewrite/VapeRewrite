/**
 * Hooks Array.from to get the game object.
 * Note: the game object CAN AND WILL change, so we don't restore the original function.
 * We can get the main object (which contains this) easier,
 * but that takes a bit longer due to it not firing always.
 * @module
 */

import { createProxy } from "@vape-rewrite/core";
import { OnlineGame } from "@wq2/narrow-one-types/src/game";

import { ranBefore } from "@/utils/runTiming";

import { main, ready as mainReady } from "./mainHook";

/** used in mainHook.ts to remove the `Array.from` hook */
export let origArrayFrom = Array.from;
/** don't use this, use the one from Refs instead. */
export let gameObj: OnlineGame;
export default function hook() {
	return new Promise<OnlineGame>((res) => {
		if (ranBefore) { // holy hack
			mainReady.then(() => {
				const gm = main.gameManager.getOnlineGame();
				if (!gm) {
					main.gameManager.onActiveGameChange(() => {
						const g = main.gameManager.getOnlineGame();
						if (g) res(g);
					});
				} else {
					res(gm);
				}
			});
		}
		Array.from = createProxy(origArrayFrom, {
			apply(target, thisArg, argArray: [ArrayLike<unknown>]) {
				const r: Array<unknown> = Reflect.apply(target, thisArg, argArray);
				const n = r[0];
				if (!n || typeof n !== "object") return r;
				const g = "game" in n && n.game;
				if (!g) return r;
				gameObj = g as OnlineGame;
				res(gameObj);
				return r;
			},
		});
	});
}
export const ready = hook();
