import type { PlayerMovement, SPacketPlayerInput } from "@wq2/miniblox-sdk";

import RotationManager from "@/utils/aiming/rotate";
import MovementCorrection, { doMovementCorrection, doSilentMovementCorrection, getEffectiveMode } from "@/utils/movement/MovementCorrection";
import Miniblox from "@/utils/refs/miniblox";
import { createProxy } from "@vape-rewrite/core";
import waitUntilReady from "@/utils/helpers/waitUntilReady";
import { gameScriptReady } from "./gameScript";

let origApplyInput: PlayerMovement["applyInput"];

/**
 * Hooks `applyInput` in order to do movement fix and stuff
 */
export default function hook() {
	const { player } = Miniblox;
	origApplyInput = player.applyInput;
	console.log(player, player.applyInput);
	player.applyInput = createProxy(origApplyInput, {
		apply(target, ts: PlayerMovement, argArray: [input: SPacketPlayerInput, _: boolean]) {
			//const [oldYaw, oldPitch, oldJumping] = [ts.yaw, ts.pitch, ts.jumping];
			const plan = RotationManager.currentPlan;
			if (!plan) return Reflect.apply(target, ts, argArray);
			const moveCorrection = getEffectiveMode(plan.movementCorrection);
			const shouldCorrect = doMovementCorrection(moveCorrection);
			if (!shouldCorrect) return Reflect.apply(target, ts, argArray);
			const [e,] = argArray;
			[ts.yaw, ts.pitch] = [plan.target.yaw, plan.target.pitch];
			ts.moveStrafe = +!!e.right + (e.left ? -1 : 0);
			ts.moveForward = (e.up ? -1 : 0) + +!!e.down;
			if (moveCorrection === MovementCorrection.Silent) {
				doSilentMovementCorrection(e, e.yaw);
			}
			const ret = Reflect.apply(target, ts, argArray);
			return ret;
		},
	});
}
Promise.all([waitUntilReady(), gameScriptReady]).then(hook);
