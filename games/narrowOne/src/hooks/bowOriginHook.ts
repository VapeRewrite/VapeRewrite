import { CancelableWrapper } from "@vape-rewrite/core";
import { createProxy } from "@vape-rewrite/core";
import type { Vector3 } from "three";

import Bus from "@/Bus";
import gameRefs from "@/utils/refs/game";

import { ready } from "./mainHook";

let orig;

function hook() {
	orig = gameRefs.network.sendCreateArrow;
	gameRefs.network.sendCreateArrow = createProxy(orig, {
		apply(
			target,
			thisArg,
			argArray: [
				gm: any,
				playerId: number,
				params: {
					arrowId: number;
					pos: Vector3;
					dir: Vector3;
					fireAmount01: number;
				},
			],
		) {
			const cw = new CancelableWrapper({
				selfID: argArray[1],
				arrowID: argArray[2].arrowId,
				dir: argArray[2].dir,
				pos: argArray[2].pos,
				fireAmount01: argArray[2].fireAmount01,
			});
			Bus.emit("createArrow", cw);
			if (cw.canceled) return;
			const { data } = cw;
			return Reflect.apply(target, thisArg, [
				gameRefs.instance,
				data.selfID,
				{
					arrowId: data.arrowID,
					pos: data.pos,
					dir: data.dir,
					fireAmount01: data.fireAmount01,
				},
			]);
		},
	});
}

ready.then(hook);
