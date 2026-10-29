import { Category, Mod } from "@vape-rewrite/core";

import Bus from "@/Bus";
import Refs from "@/utils/refs/game";
import wrap from "@/utils/selectedSlotTracker";
import type { ItemStack } from "@/utils/types";

const BLOCK_AIR = 0;
const BLOCK_TALL_GRASS = 30;
const BLOCK_SNOW_LAYER = 1362;
const BUILD_LIMIT = 320;
const BLOCK_NETHER_PORTAL = 45;

function placeBlock(
	x: number,
	y: number,
	z: number,
	hit: { x: number; y: number; z: number },
	id: number,
): boolean {
	const { game } = Refs;
	const hitBlock = game.getBlock(x, y, z);
	// Minecraft rule: tall grass / snow layer get replaced in place;
	// anything else places into the neighboring cell on the hit face.
	const softTarget = hitBlock === BLOCK_TALL_GRASS || hitBlock === BLOCK_SNOW_LAYER;
	const [px, py, pz] = softTarget ? [x, y, z] : [x + hit.x, y + hit.y, z + hit.z];

	const existing = game.getBlock(px, py, pz);
	if (!(existing === BLOCK_AIR || existing === BLOCK_TALL_GRASS || existing === BLOCK_SNOW_LAYER))
		return false;
	if (py < 0 || py >= BUILD_LIMIT) return false;

	game.setBlocks([[px, py, pz, id]]); // local set + net packet queue in one call
	return true;
}

export const BLOCK_WATER = 15;
export const BLOCK_LAVA = 24;
export const BLOCK_LAVA_FALL = 28;
function isFluid(b: number): boolean {
	return b >= BLOCK_WATER && b <= BLOCK_LAVA_FALL;
}

function isSolid(id: number) {
	const b = id;
	return (
		b !== BLOCK_AIR &&
		!isFluid(b) &&
		b !== BLOCK_TALL_GRASS &&
		b !== BLOCK_NETHER_PORTAL &&
		!(b >= 47 && b <= 49) && // 47-49: wheat
		!(b >= 1056 && b <= 1059) &&
		b !== 1006 &&
		b !== 1007 &&
		!(b >= 1008 && b <= 1009) &&
		!(b >= 1014 && b <= 1019) &&
		!(b >= 1024 && b <= 1029) &&
		!(b >= 1034 && b <= 1039) &&
		!(b >= 1048 && b <= 1049) && // dead bush, torch, gaps
		!(b >= 1084 && b <= 1087) &&
		b !== 1091 &&
		b !== 1092 &&
		b !== 1093
	); // open trapdoors and gates, campfires
}

export default class Scaffold extends Mod {
	name = "Scaffold";
	category = Category.BLATANT;

	#place() {
		const { game } = Refs;
		if (!game) return;
		const eye = game.script.getEye();
		const pos = { x: eye.x, y: eye.y - 1.5, z: eye.z };

		const blockX = Math.floor(pos.x);
		const blockY = Math.floor(pos.y);
		const blockZ = Math.floor(pos.z);
		const inv = game.getInventory();
		function getSlot() {
			// TODO: more checks
			function isValidItem(i: ItemStack) {
				return isSolid(i.id);
			}
			{
				const currentSlot = inv[wrap.s];
				if (isValidItem(currentSlot)) return wrap.s;
			}
			const slot = inv.findIndex(isValidItem);
			return slot;
		}
		const slot = getSlot();
		if (slot === -1) return;
		const id = inv[slot]?.id;
		placeBlock(blockX, blockY - 1, blockZ, { x: 0, y: 0, z: 0 }, id);
	}

	@Bus.Subscribe("preTick")
	@Bus.Subscribe("postTick")
	private onTick() {
		this.#place();
	}
}
