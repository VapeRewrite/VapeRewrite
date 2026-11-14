import "@vape-rewrite/core/meta.js?userscript-metadata";
import "@vape-rewrite/core/types/vm.d.ts";
import "./meta.js?userscript-metadata";
import "./ModuleManager";
import "./Bus";
import {hideExposed, hideStack} from "@vape-rewrite/core";
hideExposed();
hideStack();
import "./hooks/init";

const {resolve, promise} = Promise.withResolvers<void>();
if (document.body) {
	resolve();
} else {
	document.addEventListener("DOMContentLoaded", () => resolve());
}
import { initHudSystem } from "@/features/hud";
import { initApp } from "@vape-rewrite/ui";
promise.then(() => {
	initApp();
	initHudSystem();
});
