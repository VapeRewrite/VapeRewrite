import { ClientPlayer as CPlr } from "@wq2/waybackhq-types/src/client/clientplayer";
import { EntityLivingBase } from "@wq2/waybackhq-types/src/entity/entityliving";

import Refs from "@/hooks/game";

import canPlayerSeeEntity from "./wallCheck";

let ClientPlayer: typeof CPlr;
import("@wq2/waybackhq-types/src/client/clientplayer").then((mod) => {
	ClientPlayer = mod.ClientPlayer;
});

export function findTargets(range = 6, _angle = 360, checkWalls = false): EntityLivingBase[] {
	const { localPlayer: player, world } = Refs.game;
	if (world === undefined) throw new Error("findTargets called while world is null");

	const sqRange = range * range;
	const { entities } = world;

	const targets = entities.filter((e) => {
		const base = !(e instanceof ClientPlayer) || !e.isLocal;
		if (!base) return false;
		const distCheck = player.getDistanceSqToEntity(e) < sqRange;
		if (!distCheck) return false;
		const wallCheck = checkWalls && !canPlayerSeeEntity(e);
		if (wallCheck) return false;
		return true;
	});

	return targets as EntityLivingBase[];
}
