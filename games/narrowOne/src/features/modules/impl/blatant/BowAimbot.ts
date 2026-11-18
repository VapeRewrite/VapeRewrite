import { Category, Mod } from "@vape-rewrite/core";

import { solveNarrowAim, bowSpeed, bowStrength, hasClearShot, speedAtElevation } from "@/utils/aiming/projectileAim";
import canAttack from "@/utils/combat/teams";
import gameRefs from "@/utils/refs/game";
import { hook, unhook } from "@/hooks/bowHook";
import Bus from "@/Bus";
import type { Vector3 } from "three";

export class BowAimbot extends Mod {
	name = "BowAimbot";
	category = Category.BLATANT;

	private readonly modeSetting = this.createDropdownSetting("Mode", ["Silent", "Camera"], "Silent");

	get mode() {
		return this.modeSetting.value();
	}

	protected onEnable(): void {
		hook();
	}

	protected onDisable(): void {
		unhook();
	}

	@Bus.Subscribe("shootDirection")
	private onShoot(dir: Vector3) {
		const aim = this.findTarget();
		if (!aim) return;
		dir.copy(aim.direction);
	}

	private findTarget() {
		const { player: me, instance } = gameRefs;
		if (!me || !me.game || me.game.gameEnded) return;
		if (!me.bowWeapon) return;

		const victim = this.findNearest();
		if (!victim) return;

		const origin = me.getCamPos();
		const target = victim.getCamPos();

		let vel = victim.predictedServerVelocity;
		if (!vel || vel.lengthSq() < 1e-6) vel = victim.rigidBody.velocity;
		if (!vel) return;

		const tdm = me.bowWeapon?.getArrowOpts(1).travelDistanceMultiplier ?? 1;
		const strength = bowStrength(me, tdm);

		const base = bowSpeed(me, strength) * (instance.arrowManager.physics.timeScale ?? 1);
		const timeScale = instance.arrowManager.physics.timeScale;

		let aim = solveNarrowAim(origin, target, vel, base, strength);
		if (!aim) return;
		for (let i = 0; i < 3; i++) {
			const next = solveNarrowAim(origin, target, vel, speedAtElevation(me, strength, aim.pitch) * timeScale, strength);
			if (!next) break;
			const converged = Math.abs(next.pitch - aim.pitch) < 1e-4;
			aim = next;
			if (converged) break;
		}

		if (!hasClearShot(origin, target.clone().addScaledVector(vel, aim.time))) return;
		return aim;
	}

	private findNearest(): any {
		const { players, player } = gameRefs;
		if (!players || !player) return;
		let best: any = null;
		let bestDist = Infinity;
		const myPos = player.pos;
		for (const p of players.values()) {
			if (p === player || p.dead || !canAttack(player.teamId, p.teamId)) continue;
			if (!p.hasValidPosition) continue;
			const d = myPos.distanceTo(p.pos);
			if (d < bestDist) {
				bestDist = d;
				best = p;
			}
		}
		return best;
	}
}
