import type { ArrayVec3, ArrayVec2 } from "@vape-rewrite/core";

import game from "../refs/game";
import { origSendPos } from "@/hooks/hookSendPos";

/**
 * @param restoreOld restore the player's position and rotation back to what it was before
 * @returns 
 */
export function sendPos(pos: ArrayVec3, rot: ArrayVec2, restoreOld = true) {
	const { player } = game;
	if (!player) return;
	const [x, y, z] = pos;
	const [yaw, pitch] = rot;
	const oldPos = restoreOld ? player.pos.clone() : undefined;
	const oldRot = restoreOld ? player.lookRot.clone() : undefined;
	player.pos.set(x, y, z);
	player.lookRot.set(yaw, pitch);
	player.sendPlayerDataToServer();
	if (restoreOld) {
		player.pos.copy(oldPos);
		player.lookRot.copy(oldRot);
	}
}

export default function sendPosSilently(pos: ArrayVec3, rot: ArrayVec2) {
	const { player, network } = game;
	if (!player) return;
	if (network) {
		network.sendPlayerData(player.game, player.id, {
			posX: pos[0],
			posY: pos[1],
			posZ: pos[2],
			rotX: rot[0],
			rotY: rot[1],
		});
		return;
	}
	const [x, y, z] = pos;
	const [yaw, pitch] = rot;
	const { x: oX, y: oY, z: oZ } = player.pos;
	const { x: oYaw, y: oPitch } = player.lookRot;
	player.pos.set(x, y, z);
	player.lookRot.set(yaw, pitch);
	(origSendPos.bind(player) ?? player.sendPlayerDataToServer)();
	player.pos.set(oX, oY, oZ);
	player.lookRot.set(oYaw, oPitch);
}
