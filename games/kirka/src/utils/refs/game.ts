import { expose } from "@vape-rewrite/core";

import VueStore from "./vueStore";
import type { Game, Player } from "../types/unknown";
import { remapObj } from "@vape-rewrite/core";
import mappings from "../mappings/mappings";

let rawGame, game;

const gameRefs = {
	get vueState() {
		return VueStore.state;
	},

	get rawWorld() {
		const g = gameRefs.game;
		if (!g) return;
		return g.world;
	},

	get world() {
		const {rawWorld} = gameRefs;
		if (!rawWorld) return;
		return remapObj(rawWorld, mappings.world);
	},

	/**
	 * > [!WARNING]
	 * > this doesn't have the localPlayer.
	 * @returns player ID thing -> player
	 */
	get players(): Map<string, Player> {
		const w = gameRefs.world;
		if (!w) return;
		return w.players;
	},
	// get lUser() {
	// 	return Object.values(gameRefs.vueState).find(
	// 		(x) =>
	// 			typeof x === "object" && ["dailyReward", "firstGameDone", "inventory"].every((q) => q in x),
	// 	)?.user;
	// },
	get localPlayer(): Player {
		const {rawLocalPlayer} = gameRefs;
		if (!rawLocalPlayer) return;
		return remapObj(rawLocalPlayer, mappings.player);
	},

	get rawLocalPlayer() {
		return gameRefs.game?.localPlayer;
	},

	/** raw game obj without any remap proxy */
	get rawGame(): Game {
		// TODO: I don't think this is correct. the game object could change.
		if (rawGame) return rawGame;
		const vState = gameRefs.vueState;
		if (!vState) return;
		rawGame = Object.values(vState).find((value) => {
			return value != null && typeof value === "object" && "version" in value;
		});
		return rawGame;
	},

	get game(): Game {
		if (game) return game;
		const {rawGame} = gameRefs;
		if (!rawGame) return;
		game = remapObj(rawGame, mappings.game);
		return game;
	},
};

export default gameRefs;

expose("Refs", () => gameRefs);
