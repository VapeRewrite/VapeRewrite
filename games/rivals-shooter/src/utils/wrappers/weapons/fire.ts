type GameModule = typeof import("@wq2/rivals-shooter-types/src/weapons/fire");

export let mod: GameModule;
export const ready = import("@wq2/rivals-shooter-types/src/weapons/fire").then((x) => (mod = x));

export type { applySpread, shootHitscan } from "@wq2/rivals-shooter-types/src/weapons/fire";
