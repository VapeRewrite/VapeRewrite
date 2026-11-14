import type { Vector3 } from "three";

import Rotation from "./rotation";

export function lookAtPlayer(from: Vector3, target: Vector3): Rotation {
	const d = target.clone().sub(from);
	return new Rotation(
		Math.atan2(d.x, d.z),
		Math.atan2(-d.y, Math.hypot(d.x, d.z)),
	);
}
