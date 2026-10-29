import type { LegitModule } from "@vape-rewrite/core";

import { LegitModuleManager } from "@vape-rewrite/core";

export function register<T extends LegitModule>(mod: T): T {
	LegitModuleManager.add(mod);
	return mod;
}
