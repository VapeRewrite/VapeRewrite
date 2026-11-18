/**
 * Yes, this game does have built in Aim Assist.
 * I'm not joking, it's only active on mobile though.
 * @module
 */

type GameModule = typeof import("@wq2/rivals-shooter-types/src/player/AimAssist");

export let mod: GameModule;
export const ready = import("@wq2/rivals-shooter-types/src/player/AimAssist").then((x) => (mod = x));

export type { AimAssist } from "@wq2/rivals-shooter-types/src/player/AimAssist";
