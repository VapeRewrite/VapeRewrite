type GameModule = typeof import("@wq2/rivals-shooter-types/vendor/three/three.module");

export let mod: GameModule;
export const ready = import("@wq2/rivals-shooter-types/vendor/three/three.module").then((x) => (mod = x));

export type { Game } from "@wq2/rivals-shooter-types/src/core/Game";
