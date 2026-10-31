import { Category, expose, Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import isKeyDown from "@/utils/key";
import Refs from "@/utils/refs/game";
import THREE from "@/utils/refs/three";
import type { Vector3 } from "three";

type Vec2 = { x: number; z: number };

function getMoveDir(): Vector3 {
	const { currentCamera: camera } = THREE;

	const forward = new THREE.Vector3();
	camera.getWorldDirection(forward);
	forward.y = 0;
	forward.normalize();

	const worldUp = new THREE.Vector3(0, 1, 0);
	const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();

	const move = new THREE.Vector3();

	if (isKeyDown("KeyW")) move.add(forward);
	if (isKeyDown("KeyS")) move.sub(forward);
	if (isKeyDown("KeyD")) move.add(right);
	if (isKeyDown("KeyA")) move.sub(right);

	if (move.lengthSq() > 0) move.normalize();
	return move;
}

function getMoveSpeed(speed: number): Vec2 {
	const dir = getMoveDir().multiplyScalar(speed);
	return {x: dir.x, z: dir.z};
}
expose("getMoveDir", () => getMoveDir);

export default class Speed extends Mod {
	name = "Speed";
	category = Category.BLATANT;
	@Bus.Subscribe("preTick")
	private onTick() {
		const {
			game: { script },
		} = Refs;
		const move = getMoveSpeed(3.5); // speed = 3.5, horizontal only
		script.launch(move.x, 1, move.z);
	}
}
