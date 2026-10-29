import type { Vector3 } from "three";

import gameRefs, { anyReady } from "@/utils/refs/game";
import { createProxy } from "@vape-rewrite/core";
import Bus from "@/Bus";

let hooked: boolean;
export let orig: () => Vector3, playerProto;

export function isHooked() {
	return hooked;
}

export function hook() {
	if (hooked) return;
	anyReady.then(() => {
		hooked = true;
		playerProto = Object.getPrototypeOf(gameRefs.player);
		orig = playerProto.getShootDirection;
		playerProto.getShootDirection = createProxy(orig, {
			apply: (target, thisArg, argArray: []) => {
				const original = Reflect.apply(target, thisArg, argArray);
				if (!thisArg.hasOwnership) return original;
				Bus.emit("shootDirection", original);
				return original;
			},
		});
	});
}

export function unhook() {
	if (!hooked) return;
	anyReady.then(() => {
		hooked = false;
		playerProto = Object.getPrototypeOf(gameRefs.player);
		playerProto.getShootDirection = orig;
	});
}
