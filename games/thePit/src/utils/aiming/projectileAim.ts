// all catgpt code :sob:
// math is for Epstein, not me.
import type { Quaternion, Vector3 } from "three";

import THREE from "../refs/three";
import gameRefs from "../refs/game";

interface AimResult {
	time: number;
	direction: Vector3;
	yaw: number;
	pitch: number;
	quaternion: Quaternion;
}

const EPS = 1e-6;
const mapLinear = (x: number, a: number, b: number, c: number, d: number) =>
	c + ((x - a) * (d - c)) / (b - a);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const bowArrowOpts = (shooter: any, fireAmount01 = 1) =>
	shooter.bowWeapon?.getArrowOpts(fireAmount01);

export const bowSpeed = (shooter: any, strength = 500) =>
	mapLinear(strength, 100, 500, 0.05, 0.15) *
	lerp(0.82, 1.05, shooter.getStatClassValue("arrowFlySpeed"));
export const speedAtElevation = (shooter: any, strength: number, elevation: number) => {
	const base = bowSpeed(shooter, strength);
	const c = Math.cos(elevation), s = Math.sin(elevation);
	return (base * 2 * c) / (2 * c + s);
};
export const bowStrength = (shooter: any, fireAmount01 = 1) =>
	lerp(10, 500 * (bowArrowOpts(shooter, fireAmount01)?.travelDistanceMultiplier ?? 1), fireAmount01);

export function directionToShootAim(dir: Vector3): { yaw: number; pitch: number } {
	return { yaw: Math.atan2(-dir.x, -dir.z), pitch: Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) };
}
export function aimToQuaternion(p: { yaw: number; pitch: number }): Quaternion {
	return new THREE.Quaternion().setFromEuler(new THREE.Euler(p.pitch, p.yaw, 0, "YXZ"));
}

export function hasClearShot(origin: Vector3, end: Vector3): boolean {
	const {instance, player} = gameRefs;
	if (!instance || !player) return false;
	const physics = instance.arrowManager?.physics;
	if (!physics) return true;
	const cache = physics.getRayCastCache(origin, end);
	if (!cache) return true;
	const hit = physics.rayCastMapColliders(
		cache,
		(c: any) => !c.collider.ignoreArrows && c.collider.excludeTeamId !== player.teamId,
	);
	return !hit;
}

export function solveNarrowAim(
	origin: Vector3,
	targetPos: Vector3,
	targetVel: Vector3,
	vx: number,
	strength: number,
): AimResult | null {
	const vs = vx * 1000;
	const sCurve = (x: number) => 2 * (1 / (1 + Math.exp(-x)) - 0.5);
	const flatPos = new THREE.Vec2();
	const flatDist = (P: Vector3) => flatPos.set(P.x - origin.x, P.z - origin.z).length();
	const pred = (T: number) => targetPos.clone().addScaledVector(targetVel, T);

	const g = (T: number) => flatDist(pred(T)) - vs * T;

	let lo = 0.001,
		fLo = g(lo);
	let hi = 0.01,
		fHi = g(hi);
	while (hi < 40) {
		if ((fLo >= 0 && fHi <= 0) || (fLo <= 0 && fHi >= 0)) break;
		fHi = g((hi *= 2));
	}
	if (hi >= 40) return null;

	for (let i = 0; i < 60; i++) {
		const mid = (lo + hi) / 2;
		const fm = g(mid);
		if (fLo > 0 === fm > 0) {
			lo = mid;
			fLo = fm;
		} else hi = mid;
	}
	const time = (lo + hi) / 2;

	const P = pred(time);
	const X = flatDist(P);
	if (X <= EPS) return null;
	const yaw = Math.atan2(origin.x - P.x, origin.z - P.z);
	const dY = P.y - origin.y;

	let eLo = -Math.PI / 2 + 0.01,
		eHi = Math.PI / 2 - 0.01;
	for (let i = 0; i < 80; i++) {
		const mid = (eLo + eHi) / 2;
		const tE = Math.tan(mid),
			cE = Math.cos(mid),
			s = sCurve(tE);
		const c2 = Math.abs(s) < EPS ? 1 / strength : tE / (2 * s * strength * cE);
		if (c2 * X * X - tE * X + dY > 0) eLo = mid;
		else eHi = mid;
	}
	const elevation = (eLo + eHi) / 2;
	const tE = Math.tan(elevation),
		cE = Math.cos(elevation),
		s = sCurve(tE);
	const c2 = Math.abs(s) < EPS ? 1 / strength : tE / (2 * s * strength * cE);
	if (Math.abs(tE * X - c2 * X * X - dY) > 0.25) return null;

	const pitch = elevation;
	const direction = new THREE.Vec3(
		-Math.sin(yaw) * Math.cos(pitch),
		Math.sin(pitch),
		-Math.cos(yaw) * Math.cos(pitch),
	);
	return { time, direction, yaw, pitch, quaternion: aimToQuaternion({ yaw, pitch }) };
}
