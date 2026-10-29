import type { ClientEntityPlayer, RenderPlayer } from "@wq2/miniblox-sdk";

import RotationManager from "@/utils/aiming/rotate";
import MovementCorrection, { getEffectiveMode } from "@/utils/movement/MovementCorrection";
import Miniblox from "@/utils/refs/miniblox";
import { createProxy } from "@vape-rewrite/core";
import waitUntilReady from "@/utils/helpers/waitUntilReady";

let origInit: ClientEntityPlayer["init"];
type HookFn = (this: RenderPlayer, ...args: unknown[]) => void;
type HookedRenderPlayer = RenderPlayer & { renderPositionAndRotation: HookFn };
let origRenderPosAndRot: HookFn;

function hookRenderPlayer(mesh: RenderPlayer) {
	const cRenderPlayer = mesh.constructor.prototype as HookedRenderPlayer;
	const { player, controls } = Miniblox;
	origRenderPosAndRot = cRenderPlayer.renderPositionAndRotation;
	cRenderPlayer.renderPositionAndRotation = createProxy(origRenderPosAndRot, {
		apply(target, thisArg, argArray) {
			const ts: RenderPlayer = thisArg;
			if (ts.entity.id !== player.id) return Reflect.apply(target, ts, argArray);
			const plan = RotationManager.currentPlan;

			const movementCorrection = getEffectiveMode(plan?.movementCorrection);
			if (
				movementCorrection === MovementCorrection.Silent ||
				movementCorrection === MovementCorrection.Strict
			)
				return;
			// just copied the original code
			ts.position.copy(controls.position);
			ts.neck.rotation.y = RotationManager.activeRotation.yaw ?? controls.yaw;
			ts.headPivot.rotation.x = RotationManager.activeRotation.pitch ?? controls.pitch;
		},
	});
}

export default function hook() {
	const { player } = Miniblox;
	if (player.mesh) hookRenderPlayer(player.mesh);
	origInit = player.init;
	player.init = createProxy(origInit, {
		apply(target, thisArg, argArray) {
			const result = Reflect.apply(target, thisArg, argArray);
			hookRenderPlayer(player.mesh);
			return result;
		},
	});
}

waitUntilReady().then(hook);
