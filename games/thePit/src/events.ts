import type { Quaternion, Vector3 } from "three";

import type { Cancelable } from "@vape-rewrite/core";
import type { CancelableWrapper } from "@vape-rewrite/core";
import type { ArrayVec2, ArrayVec3 } from "@vape-rewrite/core";
import type { Flag, Player } from "@wq2/narrow-one-types";

export interface PosData {
	pos: Vector3;
	rot: Quaternion;
}

export interface ServerMove {
	player: Player;
	pos: ArrayVec3;
	rot: ArrayVec2;
	setback: boolean;
}

export interface CreateArrow {
    selfID: number;
    arrowID: number;
    dir: Vector3;
    pos: Vector3;
    fireAmount01: number;
}

export interface SpawnData {
	player: Player;
	ID: number;
	key: number;
}

export enum FlagChangeType {
	GRAB = 0,
	CAPTURE = 1,
	DROP = 2,
	RETURN = 3
}

export interface FlagChange {
	player: Player;
	type: FlagChangeType;
	flag: Flag;
}

export interface PlayerTickData {
	/** nowMs parameter passed to Player#loop */
	now: number;
	/** deltaMs parameter passed to Player#loop */
	dt: number;
}

type ClientEvents = {
	gameTick: void;
	playerTick: CancelableWrapper<PlayerTickData>;
	sendPos: CancelableWrapper<PosData>;
	serverMove: CancelableWrapper<ServerMove>;
	preStepVelocity: Cancelable;
	postStepVelocity: void;
	shootDirection: Vector3;
	createArrow: CancelableWrapper<CreateArrow>;
	receivedSpawn: SpawnData;
	flagChange: FlagChange;
};

export default ClientEvents;
