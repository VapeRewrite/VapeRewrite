import { CancelableWrapper } from "@vape-rewrite/core";
import { showNotification } from "@vape-rewrite/ui-api";
import { createProxy } from "@vape-rewrite/core";
import type { ArrayVec2, ArrayVec3 } from "@vape-rewrite/core";
import type { Player } from "@wq2/narrow-one-types";

import Bus from "@/Bus";
import type { ServerMove } from "@/events";
import game, { anyReady } from "@/utils/refs/game";

export let origSendPos;

export function hook() {
	if (!game.player) {
		showNotification("Hooks", "player missing, can't hook send pos", "alert", 1.5e3);
		return;
	}
	const prototype = Object.getPrototypeOf(game.player);
	origSendPos = prototype.sendPlayerDataToServer;
	prototype.setServerData = createProxy(prototype.setServerData, {
		apply(
			target,
			thisArg: Player,
			argArray: [pX: number, pY: number, pZ: number, yaw: number, pitch: number, setback: boolean],
		) {
			let [pos, rot, setback] = [
				argArray.slice(0, 3) as ArrayVec3,
				argArray.slice(4, 5) as ArrayVec2,
				argArray[5],
			];
			const wrap = new CancelableWrapper<ServerMove>({
				player: thisArg,
				pos,
				rot,
				setback,
			});
			Bus.emit("serverMove", wrap);
			const plr = wrap.data.player ?? thisArg;
			[pos, rot, setback] = [wrap.data.pos, wrap.data.rot, wrap.data.setback];
			if (!wrap.canceled) Reflect.apply(target, plr, [...pos, ...rot, setback]);
		},
	});
	prototype.sendPlayerDataToServer = createProxy(origSendPos, {
		apply(target, thisArg, argArray) {
			const [origPos, origRot] = [thisArg.pos, thisArg.lookRot];
			const [pos, rot] = [thisArg.pos.clone(), thisArg.lookRot.clone()];
			const c = new CancelableWrapper({
				pos,
				rot,
			});
			Bus.emit("sendPos", c);
			[thisArg.pos, thisArg.lookRot] = [pos, rot];
			const r = c.canceled ? undefined : Reflect.apply(target, thisArg, argArray);
			[thisArg.pos, thisArg.lookRot] = [origPos, origRot];
			return r;
		},
	});
}

// we only need game for this, main is extra.
anyReady.then(hook);
