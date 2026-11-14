import type { Vec3 } from "@wq2/waybackhq-types/src/core/aabb";
import type { Entity } from "@wq2/waybackhq-types/src/entity/entity";

import Refs from "@/hooks/game";

let Vec: typeof Vec3;
import("@wq2/waybackhq-types/src/core/aabb").then(({ Vec3 }) => (Vec = Vec3));

export default function canPlayerSeeEntity(e: Entity) {
	const { localPlayer: player, world } = Refs.game;
	return (
		world.rayTraceBlocks(
			new Vec(player.posX, player.posY + player.getEyeHeight(), this.posZ),
			new Vec(e.posX, e.posY + e.getEyeHeight(), e.posZ),
		) == null
	);
}
