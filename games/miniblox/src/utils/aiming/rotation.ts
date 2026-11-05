import type { ArrayVec2 } from "@vape-rewrite/core";
import type { AnyPacket } from "@wq2/miniblox-sdk";

export interface IRotation {
	yaw: number;
	pitch: number;
}

export default class Rotation implements IRotation {
	static ZERO = new Rotation(0, 0);

	constructor(
		public yaw: number,
		public pitch: number,
	) {}

	toAV2(): ArrayVec2 {
		const { yaw, pitch } = this;
		return [yaw, pitch];
	}

	static fromPacket(p?: IRotation): Rotation | undefined {
		if (p?.yaw !== undefined && p?.pitch !== undefined) {
			return new Rotation(p.yaw, p.pitch);
		}
		return undefined;
	}
	static hasRotation(p?: AnyPacket): p is IRotation {
		if (p === undefined) return false;
		return "yaw" in p && "pitch" in p;
	}
}
