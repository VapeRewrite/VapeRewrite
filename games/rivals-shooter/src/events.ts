import type { CancelableWrapper } from "@vape-rewrite/core";
import type { Input } from "@wq2/rivals-shooter-types/src/core/Input";
import type { Vector3 } from "three";

export interface PlayerTickData {
	dt: number;
	input: Input;
}

export interface PhysicsTickData {
	step: number;
	moveDir: Vector3;
	moveDirAmount: number;
	/**
	 * note:
	 * if the player is "locked" in place,
	 * this will be false even if they try to sprint.
	 */
	sprint: boolean;
}

export type ClientEvents = {
	gameTick: void;
	playerTick: CancelableWrapper<PlayerTickData>;
	physicsTick: CancelableWrapper<PhysicsTickData>;
	postPhysicsTick: PhysicsTickData;
};
