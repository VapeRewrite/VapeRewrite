import { expose, MAIN_LOGGER as logger } from "@vape-rewrite/core";

function isIndexPath(pathname: string): boolean {
	return pathname.startsWith("/assets/js/app.") && pathname.endsWith(".js");
}

function isGameScript(script: HTMLScriptElement): boolean {
	const { src } = script;
	if (src.length <= 18 /*length of /assets/js/app. + length of .js*/) return false;
	if (script.type !== "module") return false;
	try {
		return isIndexPath(new URL(src).pathname);
	} catch {
		return false;
	}
}

export let gameScript: string;
export let scriptEl: HTMLScriptElement;

async function init() {
	const sc = Object.values(document.scripts).find((script) => isGameScript(script));
	if (!sc) {
		logger.error("Failed to find game script");
		return;
	}
	scriptEl = sc;
	if (scriptEl?.src) {
		const res = await fetch(scriptEl.src);
		gameScript = await res.text();
	}
    expose("gameScript", () => gameScript);
}
export const gameScriptReady = init();
