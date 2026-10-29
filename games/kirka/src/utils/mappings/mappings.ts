/**
 * Contains various mappings for objects. These are used in the auto-remapping proxy, so you don't have to think about using dumps ever again!
 * @todo consider using strings from source code for mappings.
 * @module
 */

import { expose } from "@vape-rewrite/core";
import { initOrR } from "@vape-rewrite/core";
import { reverseMapping, type Mapping } from "@vape-rewrite/core";

import gameRefs from "../refs/game";
import type { Game, Player, World } from "../types/unknown";
import { MATCHED_DUMPS } from "@/hooks/dumps";
import type { DumpKey } from "@/hooks/dumps";

function ofDumps<K extends DumpKey>(...ks: K[]): Record<K, string> {
	return Object.fromEntries(
		ks.map((k) => [MATCHED_DUMPS[k], k] as const).filter(([k]) => k !== undefined),
	) as unknown as Record<K, string>;
}

// in an object so they can easily be modified at runtime via just redefining them.
const mapFrom = {
	lPlr(lplr: Player): Mapping {
		const entries = Object.entries(lplr);
		// we only need the keys for creating mappings.
		// mappings only change every update, not every script load or whatever.
		const [rank] = entries.find(([, x]) => x != null && typeof x === "string" && x === "USER");
		// TODO: this broke..?
		// const [team] = entries.find(
		// 	([k, x]) => x != null && typeof x === "string" && ["red", "blue"].includes(x),
		// );
		const [id] = entries.find(([, x]) => x != null && typeof x === "string" && x.length === 9);
		// three numbers and a field with a "schema" property in it.
		const [pos] = entries.find(([, x]) => {
			if (x == null) return false;
			if (typeof x !== "object") return false;
			const objEntries = Object.entries(x);
			// really hacky
			const posFields = objEntries.filter(([k, x]) => {
				if (x == null) return false;
				if (typeof x !== "number") return false;
				if (k.startsWith("$")) return false;
				return true;
			});
			if (posFields.length < 3) return false;
			return true;
		});
		return reverseMapping({
			rank,
			// team,
			id,
			pos,
		});
	},
	game(game: Game): Mapping {
		const entries = Object.entries(game);
		const [localPlayer] = entries.find(
			([, x]) => x != null && Object.keys(x).includes("fillMoveX___SYNC"),
		);
		const [world] = entries.find(
			([, x]) =>
				x != null &&
				typeof x === "object" &&
				["player", "dtRatio", "time", "scene2", "bulletCases"].every((q) => q in x),
		);
		return reverseMapping({
			localPlayer,
			world,
		});
	},
	world(world: World): Mapping {
		const entries = Object.entries(world);
		const [players] = entries.find(
			// size > 1 can be false if you're the only one in the game.
			([, x]) => typeof x === "object" && x instanceof Map /*&& x.size > 1*/,
		);
		return reverseMapping({
			players,
		});
	},
};

const mappings = new (class Mappings {
	#Player?: Mapping;
	#world?: Mapping;
	#game?: Mapping;
	#vector?: Mapping;
	get player() {
		return initOrR(this.#Player, () => {
			const { rawLocalPlayer } = gameRefs;
			if (!rawLocalPlayer) return;
			return mapFrom.lPlr(rawLocalPlayer);
		});
	}
	get game() {
		return initOrR(this.#game, () => {
			const { rawGame } = gameRefs;
			if (!rawGame) return;
			return mapFrom.game(rawGame);
		});
	}
	get vector() {
		return initOrR(this.#vector, () => ofDumps("x", "y", "z"));
	}
	get world() {
		return initOrR(this.#world, () => {
			const { rawWorld } = gameRefs;
			if (!rawWorld) return;
			return mapFrom.world(rawWorld);
		});
	}
})();

expose("mappings", () => mappings);
expose("mapFrom", () => mapFrom);

export default mappings;
