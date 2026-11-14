/**
 * Really only exists because we don't have the full `main` object until a few seconds in.
 * @module
 */

import type { Game, GameManager, NetworkManager, Player } from "@wq2/narrow-one-types/src/game";

import { expose } from "@vape-rewrite/core";

import { main, ready as mainReady } from "@/hooks/mainHook";

export const anyReady = /*Promise.race([mainReady])*/ mainReady;

const gameRefs = {
	get instance(): Game | undefined {
		return main.wd.yd;
	},
	get player() {
		const game = gameRefs.instance; // active Ui instance
		let player = null;
		for (const p of game.bd()) {
			// bd() yields owned players
			if (p.Bd) {
				player = p;
				break;
			}
		}
		return player;
	},
	// get players(): Map<number, Player> | undefined {
	// 	return this.instance?.players;
	// },
};

expose("Refs", () => gameRefs);

export default gameRefs;
