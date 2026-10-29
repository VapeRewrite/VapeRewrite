import { Category, Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import Refs from "@/utils/refs/game";

type Vec3 = { x: number; y: number; z: number };

function getPlayerMoveDir(speed: number, horizontalOnly = false): Vec3 {
	const {
		game: { script: api },
	} = Refs;
	const eye = api.getEye();
	const look = api.getLook();

	let dx = look.x - eye.x;
	let dy = look.y - eye.y;
	let dz = look.z - eye.z;

	if (horizontalOnly) {
		dy = 0;
	}

	const len = Math.hypot(dx, dy, dz) || 1;

	return {
		x: (dx / len) * speed,
		y: (dy / len) * speed,
		z: (dz / len) * speed,
	};
}

export default class Speed extends Mod {
	name = "Speed";
	category = Category.BLATANT;
	@Bus.Subscribe("preTick")
	private onTick() {
		const {
			game: { script },
		} = Refs;
		const move = getPlayerMoveDir(3.5, true); // speed = 3.5, horizontal only
		script.launch(move.x, move.y, move.z);
	}
}
