export type ArrayVec3 = [x: number, y: number, z: number];
export type ArrayVec2 = [x: number, y: number];

interface Vec3Like {
	x: number;
	y: number;
	z: number;
}

/** A really basic Vector3 class. */
export class SimpleVec3 {
	public static readonly ZERO = new SimpleVec3 /* all coords defaults to 0 */();
	constructor(
		public x: number = 0,
		public y: number = 0,
		public z: number = 0,
	) {}

	subtracted(from: SimpleVec3) {
		return new SimpleVec3(this.x - from.x, this.y - from.y, this.z - from.z);
	}

	static fromVec3Like(v: Vec3Like): SimpleVec3 {
		return new SimpleVec3(v.x, v.y, v.z);
	}
}

/** A really basic Vector2 class. */
export class SimpleVec2 {
	public static readonly ZERO = new SimpleVec2 /* all coords default to 0 */();
	constructor(
		public x: number = 0,
		public y: number = 0,
	) {}
}
