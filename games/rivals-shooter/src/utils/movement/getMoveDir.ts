import type { Input } from "@wq2/rivals-shooter-types/src/core/Input";
import type { Player } from "@wq2/rivals-shooter-types/src/player/Player";
import type { Vector3 } from "three";

import { ready } from "../refs/three";

let _wishDir: Vector3;
ready.then((THREE) => {
	_wishDir = new THREE.Vector3();
});

export function getMoveDir(input: Input, player: Player, y = 0) {
	const locked = player.frozen || !player.alive;
	const mx = locked ? 0 : input.moveX,
		my = locked ? 0 : input.moveY;
	const sin = Math.sin(player.yaw),
		cos = Math.cos(player.yaw);
	_wishDir.set(-sin * my + cos * mx, y, -cos * my - sin * mx);
	const wishAmount = Math.min(_wishDir.length(), 1);
	if (wishAmount > 0) _wishDir.normalize();
	return _wishDir.clone();
}

export default function getMove(speed: number, input: Input, player: Player, y = 0) {
	return getMoveDir(input, player, y).multiplyScalar(speed);
}
