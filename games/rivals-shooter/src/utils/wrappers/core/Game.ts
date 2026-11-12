type GameModule = typeof import("@wq2/rivals-shooter-types/src/core/Game");

export let mod: GameModule;
export const ready = import("@wq2/rivals-shooter-types/src/core/Game").then((x) => (mod = x));

export type { Game } from "@wq2/rivals-shooter-types/src/core/Game";
