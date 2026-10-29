import { expose } from "@vape-rewrite/core";
import type { GameHandle, MultiplayerClient } from "../types";
import {handle} from "@/hooks/gameHook";
import { mp } from "@/hooks/multiplayerHook";

const gameRefs = {
	get game(): GameHandle | undefined {
		return handle;
	},
	get multiplayerClient(): MultiplayerClient | undefined {
		return mp;
	},
	get script() {
		return gameRefs.game?.script;
	}
};

export default gameRefs;

expose("Refs", () => gameRefs);
