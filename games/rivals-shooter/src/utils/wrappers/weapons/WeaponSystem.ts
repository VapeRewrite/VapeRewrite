type GameModule = typeof import("@wq2/rivals-shooter-types/src/weapons/WeaponSystem");

export let mod: GameModule;
export const ready = import("@wq2/rivals-shooter-types/src/weapons/WeaponSystem").then(
	(x) => (mod = x),
);

export type { WeaponSystem } from "@wq2/rivals-shooter-types/src/weapons/WeaponSystem";
