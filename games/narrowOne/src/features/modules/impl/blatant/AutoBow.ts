import { Category, Mod } from "@vape-rewrite/core";
import type { Vector3 } from "three";

import Bus from "@/Bus";
import { hook, unhook } from "@/hooks/bowHook";
import { solveNarrowAim, bowSpeed, bowStrength, hasClearShot } from "@/utils/aiming/projectileAim";
import canAttack from "@/utils/combat/teams";
import gameRefs from "@/utils/refs/game";
import { main } from "@/hooks/mainHook";

export class AutoBow extends Mod {
	name = "AutoBow";
	category = Category.BLATANT;
	#target: Vector3 | null = null;

	protected onEnable(): void {
		hook();
	}

	protected onDisable(): void {
		unhook();
		this.#target = null;
	}

	@Bus.Subscribe("shootDirection")
	private onShoot(dir: Vector3) {
		const aim = this.#target;
		if (!aim) return;
		dir.copy(aim);
		this.#target = null;
	}

	@Bus.Subscribe("gameTick")
	private onTick() {
		const { player: me } = gameRefs;
		if (!me || !me.game || me.game.gameEnded || me.dead) return;
		const bow = me.bowWeapon;
		if (!bow) return;

		// no cooldown accessor on every bow — repeating crossbow has none
		const cd = (bow.getFireCooldownActive ?? bow.getFireUpCooldownActive ?? bow.getCooldownActive)?.call(bow);
		if (cd) return;

		const shot = this.findShot(me);
		if (!shot) return;

		this.#target = shot.direction;

		// mirror the bow's own fire bookkeeping so its cooldown accessor gates
		// the next tick: lastFireUp (med/large/multi), lastFireTime (small xbow),
		// lastShootTime (large xbow)
		const now = main?.now ?? 0;
		if ("lastFireUp" in bow) bow.lastFireUp = now;
		if ("lastFireTime" in bow) bow.lastFireTime = now;
		else if ("lastShootTime" in bow) bow.lastShootTime = now;

		bow.shootArrow(1);
	}

	private findShot(me: any) {
		const victim = this.findNearest();
		if (!victim) return null;

		const origin = me.getCamPos();
		const target = victim.getCamPos();
		let vel = victim.predictedServerVelocity;
		if (!vel || vel.lengthSq() < 1e-6) vel = victim.rigidBody.velocity;
		if (!vel) return null;

		const tdm = me.bowWeapon.getArrowOpts?.(1)?.travelDistanceMultiplier ?? 1;
		const strength = bowStrength(me, tdm);

		const base = bowSpeed(me, strength) * (gameRefs.instance?.arrowManager?.physics?.timeScale ?? 1);
		const speedAt = (pitch: number) => {
			const c = Math.cos(pitch), s = Math.sin(pitch);
			return (base * 2 * c) / (2 * c + s);
		};

		let aim = solveNarrowAim(origin, target, vel, base, strength);
		if (!aim) return null;
		for (let i = 0; i < 3; i++) {
			const next = solveNarrowAim(origin, target, vel, speedAt(aim.pitch), strength);
			if (!next) break;
			const converged = Math.abs(next.pitch - aim.pitch) < 1e-4;
			aim = next;
			if (converged) break;
		}

		if (!hasClearShot(origin, target.clone().addScaledVector(vel, aim.time))) return null;
		return aim;
	}

	private findNearest(): any {
		const { players, player } = gameRefs;
		if (!players || !player) return null;
		let best: any = null,
			bestDist = Infinity;
		for (const p of players.values()) {
			if (p === player || p.dead || !p.hasValidPosition) continue;
			if (!canAttack(player.teamId, p.teamId)) continue;
			const d = player.pos.distanceTo(p.pos);
			if (d < bestDist) {
				bestDist = d;
				best = p;
			}
		}
		return best;
	}
}
