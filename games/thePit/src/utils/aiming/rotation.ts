export interface IRotation {
	yaw: number;
	pitch: number;
}

export default class Rotation implements IRotation {
	static ZERO = new Rotation(0, 0);

	constructor(
		/** @alias x */
		public yaw: number,
		/** @alias y */
		public pitch: number,
	) {}
}
