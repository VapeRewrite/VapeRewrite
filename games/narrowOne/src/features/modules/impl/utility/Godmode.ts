/**
 * A GodMode...
 * Doesn't really work well on CTF,
 * since they check if the player is actually alive before letting them grab the flag...
 * but grabbing it before dying and then trying to grab it again since it dropped works..?
 * great anticheat.
 * anyway, everything else works normally as you'd expect with it
 * (using the bow, moving, melee probably also, etc.).
 * haven't tested the King of The Hill game mode yet,
 * but it'll probably work since the server probably doesn't check there...
 * @module
 */
import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";
import { createProxy } from "@vape-rewrite/core";
import type { Player } from "@wq2/narrow-one-types/src/game";

import gameRefs, { anyReady } from "@/utils/refs/game";

let origProto: Player, origDie: Player["die"], hooked = false;

export default class GodMode extends Mod {
	name = "GodMode";
	category = Category.UTILITY;
	#hook() {
		if (!origProto || !origDie) return;
		hooked = true;
		origProto.die = createProxy(origProto.die, {
			apply(target, thisArg: Player, argArray: [respawn?: boolean]) {
				if (!thisArg.hasOwnership) return Reflect.apply(target, thisArg, argArray);
				// for some reason, the server acts more like a relay than a server.
				// things you'd expect the server to have authority over (like the player dying),
				// are actually owned by the client.
				thisArg.health = Infinity;
				thisArg.dead = false;
				thisArg.updateHealthUi();
			},
		});
	}
	#unhook() {
		if (!origProto || !origDie || !hooked) return;
		origProto.die = origDie;
		hooked = false;
		const {player} = gameRefs;
		if (!player) return;
		if (player.health === Infinity) player.health = 100;
	}
	protected onEnable(): void {
		anyReady.then(() => {
			if (hooked) return;
			const { player } = gameRefs;
			origProto = Object.getPrototypeOf(player);
			origDie = origProto.die;
			this.#hook();
		});
	}
	protected onDisable(): void {
		if (!hooked) return;
		this.#unhook();
	}
}
