// --- setup: g = your handle (fiber-walk), mp = Multiplayer instance (fiber-walk: has sendHit + sendWhisper + sendRanks)

import { ready } from "@/hooks/gameHook";

import gameRefs from "./refs/game";
import type { ItemStack } from "./types";

// Track selected slot once:
let sel = 0;
ready.then((g) => g.onSelectedSlotChange?.((i) => (sel = i)));

// Weapon damage: spears are ids 1790-1796 (wood..infernium), mace 1797. Fill sword/axe/pickaxe ids the same
// way, or measure any weapon by hitting something once and reading the engine 'playerHit' damage.
const WEAPON_DAMAGE = {
	1790: 3,
	1791: 4,
	1792: 5,
	1793: 3,
	1794: 6,
	1795: 7,
	1796: 9, // spears
	1797: 6, // mace
	// [id]: 7, // diamond sword, etc.
};
const UNDEAD = new Set(["zombie", "skeleton", "cinderbone", "hollow_tyrant"]);
const lvl = (st: ItemStack, k: string) => st?.ench?.[k] ?? 0;

function weaponDamage(held: ItemStack, mobType: string, crit?: boolean) {
	let dmg = WEAPON_DAMAGE[held?.id ?? -1] ?? 1; // bare hands = 1 (game: 0+... effectively 1)
	dmg += 0.5 * lvl(held, "sharpness") + 0.5;
	if (UNDEAD.has(mobType)) dmg += 2.5 * lvl(held, "smite");
	if (mobType === "spider") dmg += 2.5 * lvl(held, "bane_of_arthropods");
	dmg += 3 * lvl(held, "strength") - 4 * lvl(held, "weakness"); // strength not on item stacks — pass via o if known
	if (crit) dmg *= 1.5; // crits remove strength/weakness sign nuance: same order in game
	return Math.max(0.5, dmg);
}

export interface MeleeOptions {
	dmg?: number;
	kb?: number;
	fire?: boolean;
	durability?: boolean;
	sprintKb?: boolean;
	bow?: boolean;
	breach?: number;
	smash?: boolean;
	crit?: boolean;
}

/**
 * Fully emulate a melee hit on entity `id` (mob OR remote player), except ray-tracing.
 * opts: { crit?, sprintKb?, kb (override), dmg (override), fire?, bow?, breach?, smash? }
 */
export default function meleeHit(id: number, o: MeleeOptions = {}) {
	const { game: g, multiplayerClient: mp } = gameRefs;
	const eye = g.script.getEye();
	const st = g.getInventory();
	const held = st[sel];
	const kbEnch = lvl(held, "knockback");

	// ---- local mob ----
	const mob = g.script.listEntities().find((e) => e.id === id);
	if (mob) {
		const dmg = o.dmg ?? weaponDamage(held, mob.type, o.crit);
		const kb = o.kb ?? Math.min(20, 1 + kbEnch + (o.sprintKb ? 1 : 0)); // game: 7 + 6*kb total, damageEntity multiplies by 7
		const ok = g.script.damageEntity(id, dmg, kb);
		// full-path extras damageEntity lacks, applied where the handle allows:
		if (ok && o.fire) {
		} // Fire Aspect: no igniteMob on handle script — only available via real mousedown; approximate as extra damage or skip
		if (ok && o.durability) {
		} // weapon wear is internal; nothing to call
		return ok && { mob, dmg, kb };
	}

	// ---- remote player ----
	const rp = g.listPlayers().find((p) => p.id === id);
	if (rp && mp) {
		const dmg = o.dmg ?? weaponDamage(held, "player", o.crit); // pre-armor
		const dx = rp.x - eye.x,
			dz = rp.z - eye.z,
			len = Math.hypot(dx, dz) || 1;
		const kbm = o.sprintKb ? 1.8 : o.smash ? 1.5 : 1; // matches strikeRemote
		mp.sendHit(
			id,
			Math.round(dmg * 10) / 10,
			Math.round((dx / len) * 100) / 100,
			Math.round((dz / len) * 100) / 100,
			!!o.bow,
			{ kbm: kbm > 1 ? kbm : undefined, breach: o.breach || undefined },
		);
		g.remoteHurtFx(id); // local flash + hit sfx so it feels real in your render
		return { player: rp, dmg };
	}
	return null;
}
