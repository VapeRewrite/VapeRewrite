import "@vape-rewrite/core/meta.js?userscript-metadata";
import "@vape-rewrite/core/types/vm.d.ts";
import "./meta.js?userscript-metadata";
import "./ModuleManager";
import "./Bus";
import {hideExposed, hideStack} from "@vape-rewrite/core";
hideExposed();
hideStack();
import "./hooks/init";
import { initApp } from "@vape-rewrite/ui";

import { initHudSystem } from "@/features/hud";
initApp();
initHudSystem();
