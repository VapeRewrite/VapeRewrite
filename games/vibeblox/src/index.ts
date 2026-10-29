import "@vape-rewrite/core/meta.js?userscript-metadata";
import "@vape-rewrite/core/types/vm.d.ts";
import "./meta.js?userscript-metadata";
import "./ModuleManager";
import "./Bus";
import "./utils/refs/game";
import "@vape-rewrite/core";
import { hideExposed, hideStack } from "@vape-rewrite/core";
hideStack();
hideExposed();
// TODO: hooks
import { initApp } from "@vape-rewrite/ui";

import { initHudSystem } from "@/features/hud";
initApp();
initHudSystem();
