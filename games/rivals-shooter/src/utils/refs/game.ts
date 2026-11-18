import type { Game } from "@/utils/wrappers/core/Game";
import type { Player } from "@wq2/rivals-shooter-types/src/player/Player";

import { expose } from "@vape-rewrite/core";

import { game } from "@/hooks/gameHook";

export { ready } from "@/hooks/gameHook";

const gameRefs = {
	get game(): Game | undefined {
		return game;
	},
	get player(): Player {
		return game.player;
	},
};

export default gameRefs;

expose("Refs", () => gameRefs);
