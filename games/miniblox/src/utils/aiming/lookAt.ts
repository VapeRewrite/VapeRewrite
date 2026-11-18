import Rotation from "./rotation";
import type { SimpleVec3 } from "@vape-rewrite/core";

// function wrapAngleTo180_radians(angle: number): number {
// 	let ang = angle;
// 	ang = ang % (Math.PI * 2);
// 	if (ang >= Math.PI) {
// 		ang -= Math.PI * 2;
// 	}
// 	if (ang < -Math.PI) {
// 		ang += Math.PI * 2;
// 	}
// 	return ang;
// }

/**
 * Calculates a rotation vector for looking at the target.
 * @param origin i.e. player.pos
 * @param target i.e. target.pos
 */
export default function calculateRotations(origin: SimpleVec3, target: SimpleVec3): Rotation {
	const aimPos = origin.subtracted(target);
	const newYaw = Math.hypot(aimPos.x, aimPos.z);

	const horizontalDist = Math.sqrt(aimPos.x * aimPos.x + aimPos.z * aimPos.z);

	const targetPitch = Math.atan2(aimPos.y, horizontalDist);

	return new Rotation(newYaw, targetPitch);
}
