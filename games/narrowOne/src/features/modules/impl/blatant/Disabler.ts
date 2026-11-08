/**
 * idea²:
 * I was messing with holding in packets and then re-sending them.
 * Sending NaN pos setbacks you, but it only works if it beats the
 * server's own check, so it's ping sensitive.
 * Same idea without the timing: when a tick jumps more than 11 blocks,
 * re-send the previous position, then the new one, and drop the original
 * packet, so the server never sees an out-of-range step.
 * A setback landing right after one of those replays gets the same
 * treatment instead of being applied to the client.
 * @module
 */

import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";
import { CancelableWrapper } from "@vape-rewrite/core";

import Bus from "@/Bus";
import type { PosData } from "@/events";
import sendPosSilently from "@/utils/movement/sendPos";
import Refs from "@/utils/refs/game";
import type { ArrayVec2 } from "@vape-rewrite/core";
import type { Vector3 } from "three";

export default class Disabler extends Mod {
	name = "Disabler";
	category = Category.BLATANT;
	#lastPos: Vector3;
	// #lastMove: number = -1;

	// somewhat buggy and desyncs sometimes
	// @Bus.Subscribe("serverMove")
	// private onServerMove(wrap: CancelableWrapper<ServerMove>) {
	// 	if (Date.now() - this.#lastMove > 2e3) return;
	// 	const { data } = wrap;
	// 	if (!data.setback) return;
	// 	const { player } = Refs;
	// 	if (!player) return;
	// 	if (data.player !== player) return;
	// 	const playerPos: Vector3 = this.#lastPos;
	// 	wrap.cancel();
	// 	sendPosSilently(playerPos.toArray(), [player.lookRot.x, player.lookRot.y]);
	// 	sendPosSilently(data.pos, [player.lookRot.x, player.lookRot.y]);
	// }

	@Bus.Subscribe("sendPos")
	private onSendPos(wrap: CancelableWrapper<PosData>) {
		const { player } = Refs;
		if (!player) return;
		const pos: Vector3 = wrap.data.pos;
		const lastPos = this.#lastPos ??= pos.clone();
		this.#lastPos = pos.clone();
		if (pos.distanceTo(lastPos) < 11) return;
		const lr: ArrayVec2 = [player.lookRot.x, player.lookRot.y];
		for (let i = 0; i < 5e3; i++) {
			sendPosSilently(pos.toArray(), lr);
		}
		sendPosSilently(lastPos.toArray(), lr);
		// this.#lastMove = Date.now();
		wrap.cancel();
	}
}
