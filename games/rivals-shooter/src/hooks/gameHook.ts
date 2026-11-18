import { createProxy } from "@vape-rewrite/core";

import { type Game, ready as gameReady } from "@/utils/wrappers/core/Game";

export let game: Game;
// game only has one reference, and its never changed.
// we can just hook any method that we know will get invoked, capture thisArg, and unhook.
let origTick: Game["tick"];

export default async function hook() {
	const mod = await gameReady;
	const {promise, resolve} = Promise.withResolvers<Game>();
	// I could literally use the target parameter, why am I doing ts???
	// ok who cares LOL
	origTick = mod.Game.prototype.tick;
	mod.Game.prototype.tick = createProxy(origTick, {
		apply(target, thisArg, argArray) {
			game = thisArg;
			resolve(thisArg);
			mod.Game.prototype.tick = origTick;
			return Reflect.apply(target, thisArg, argArray);
		},
	});
	return promise;
}

export const ready = hook().then((h) => (game = h));
