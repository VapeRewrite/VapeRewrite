import { HudManager } from "@vape-rewrite/core";

import ArrayListHud from "./impl/ArrayListHud";
import SpeedHud from "./impl/SpeedHud";

// Register all HUD types
export function initHudSystem() {
	HudManager.registerHudType(ArrayListHud);
	HudManager.registerHudType(SpeedHud);
}

export { BaseHudElement } from "@vape-rewrite/core";
export { CanvasHudElement } from "@vape-rewrite/core";
export { JSXHudElement } from "@vape-rewrite/core";
export { HudManager };
