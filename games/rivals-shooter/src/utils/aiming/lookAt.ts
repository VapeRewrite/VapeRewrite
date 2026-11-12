/**
 * @todo: implement properly
 * pasted from Trollium for Kirka.io
 */

(() => {})();

import { SimpleVec3 } from "@vape-rewrite/core";
import gameRefs from "../refs/game";
const yawMax = Math.PI * 2; // if it's above this, move down to 0
/*export function lookAt({ x, y, z }: SimpleVec3, returnValues = false) {
	const localPosition = gameRefs.localPlayer.pos;

	const localX = localPosition[offsets.playerX];
	const localY = localPosition[offsets.playerY];
	const localZ = localPosition[offsets.playerZ];

	const deltaX = x - localX;
	const deltaY = y - localY;
	const deltaZ = z - localZ;

	const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);

	let yaw = Math.atan2(-deltaX, -deltaZ);
	if (yaw < 0) {
		yaw += yawMax;
	}

	let pitch = Math.asin(deltaY / distance); //Math.atan2(deltaY, distance)
	pitch = Math.max(-1.57, Math.min(1.57, pitch));

	if (returnValues) {
		return [pitch, yaw];
	} else {
		const viewAngles = angles();
		viewAngles[offsets.x] = pitch;
		viewAngles[offsets.y] = yaw;
	}
}

function screen(position) {
	if (position[offsets.playerX] !== undefined) {
		position = fixpos(position);
	}

	const cloned = new vector3.constructor(
		position[offsets.x],
		position[offsets.y],
		position[offsets.z],
	);


	// Camera order is YXZ

	cloned[offsets.project](camera);

	const screenX = ((cloned[offsets.x] + 1) * width()) / 2;
	const screenY = ((1 - cloned[offsets.y]) * height()) / 2;
	const depth = cloned[offsets.z];
	const visible = depth >= -1 && depth <= 1;

	return [screenX, screenY, visible];
}*/
