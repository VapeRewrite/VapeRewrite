import { Category } from "@vape-rewrite/core";
import { Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import game from "@/utils/refs/game";
import sendPosSilently from "@/utils/movement/sendPos";
import { CancelableWrapper } from "@vape-rewrite/core";
import type { ServerMove } from "@/events";
import type { Vector3 } from "three";

export default class TeleportTest extends Mod {
	public name = "TeleportTest";
	public category = Category.BLATANT;
	#target: Vector3 | null = null;

	@Bus.Subscribe("serverMove")
	private onSetback({data: {player, setback, pos}}: CancelableWrapper<ServerMove>) {
		if (!player.hasOwnership || setback) return;
		const pVec = this.#target.clone().fromArray(pos);
		const distance = pVec.distanceTo(player.pos);
		if (distance >= 3) return;
		player.setPosition(pVec);
	}

	@Bus.Subscribe("gameTick")
	private async onTick() {
		const {player, onlineInstance: instance} = game;
		if (!instance) return this.#target = null;
		const target = instance
			.getEnemyFlags(player.teamId)
			.toArray()[0]
			.position;
		const targetA = target.toArray();
		const rot = player.lookRot.toArray();
		for (let i = 0; i < 1e3; i++) {
			sendPosSilently(targetA, rot);
		}
		this.#target = target;
		sendPosSilently(player.rigidBody.pos.toArray(), rot);
	}
	protected onDisable(): void {
		this.#target = null;
	}
}
