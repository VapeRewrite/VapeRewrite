import type { EntityLivingBase } from "@wq2/miniblox-sdk";

import { teamsByServerEnabled } from "@vape-rewrite/core";

import Miniblox from "../refs/miniblox";

export function findTargets(range = 6, _angle = 360, checkWalls = false): EntityLivingBase[] {
	const { player, EntityLivingBase, EntityPlayer, world } = Miniblox;
	if (world === undefined) throw new Error("findTargets called while world is null");
	const localTeam = player.team;

	const sqRange = range * range;
	// auto remapping proxy!
	const entities = Array.from(world.entities.values());

	const targets = entities.filter((e) => {
		const base = e instanceof EntityLivingBase && e.id !== player.id;
		if (!base) return false;
		const distCheck = player.getDistanceSqToEntity(e) < sqRange;
		if (!distCheck) return false;
		if (teamsByServerEnabled() && e instanceof EntityPlayer) {
			const otherTeam = e.team;
			const teamCheck = localTeam && otherTeam && !localTeam.canAttack(otherTeam);
			if (teamCheck) return false;
		}
		const wallCheck = checkWalls && !player.canEntityBeSeen(e);
		if (wallCheck) return false;
		return true;
	});

	return targets as EntityLivingBase[];
}
