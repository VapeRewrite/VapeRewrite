import type { Player } from "@wq2/narrow-one-types";

import THREE from "../refs/three";
import { expose } from "@vape-rewrite/core";

interface CalculateMoveSpeedOpts {
	/** allows the player to walk on "unwalkable" colliders */
	ignoreUnwalkableColliders: boolean;
	/** ignores slippery colliders */
	ignoreSlipperyColliders: boolean;
	/** even if the player is holding a flag, still use the normal walk speed? */
	ignoreFlagWalkSpeed: boolean;
	/** doesn't do the collider slowdown thing */
	ignoreColliderSlowdown: boolean;
}

export default function calculateMoveSpeed(
	player: Player,
	{
		ignoreFlagWalkSpeed,
		ignoreSlipperyColliders,
		ignoreUnwalkableColliders,
        ignoreColliderSlowdown
	}: CalculateMoveSpeedOpts,
) {
	let moveSpeed =
		player.holdingFlag && !ignoreFlagWalkSpeed ? player.flagWalkSpeed : player.walkSpeed;
	if (player.rigidBody.isOnUnwalkableCollider && !ignoreUnwalkableColliders) {
		moveSpeed = 0;
	} else if (player.rigidBody.isOnSlipperyCollider && !ignoreSlipperyColliders) {
		moveSpeed *= 0.15;
	} else if (player.rigidBody.climbingLadder) {
		moveSpeed *= player.ladderClimbSpeed;
	} else if (!player.rigidBody.isOnFloor) {
		moveSpeed *= player.airWalkSpeedMultiplier;
	}
	const slowdownMultiplier = 0.8;
	if (!ignoreColliderSlowdown)
        moveSpeed *= 1 / (player.rigidBody.slowDownColliderAmount * slowdownMultiplier + 1);
	moveSpeed *= THREE.lerp(0.9, 1.1, player.getStatClassValue("movementSpeed"));
	if (player.activeWeapon) {
		moveSpeed *= player.activeWeapon.getWalkSpeedMultiplier();
	}
	// for (const stunEvent of player.recentStunEvents) {
	// 	const elapsed = nowMs - stunEvent.time;
	// 	if (elapsed < stunEvent.stun.duration + stunEvent.stun.fadeDuration) {
	// 		const stunDuration = stunEvent.stun.duration;
	// 		const fadeEnd = stunDuration + stunEvent.stun.fadeDuration;
	// 		moveSpeed *= 1 - q(stunDuration, fadeEnd, stunEvent.stun.amount, 0, elapsed, true);
	// 	} else {
	// 		player.recentStunEvents.delete(stunEvent);
	// 	}
	// }
    return moveSpeed;
}

expose("calculateMoveSpeed", () => calculateMoveSpeed);