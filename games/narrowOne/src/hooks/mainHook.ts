/**
 * we used to hook `new Function` since they didn't check error stack, but now they do :(
 * anyway its fixed. hang Jesper, seriously,
 * you come alive with a SILENT UPDATE TO DETECT VAPE REWRITE :rage:
 * its fine though, now you're just going to have a harder time detecting us.
 * I already know a way to detect it on EVERY site version thing (THAT I ACCIDENTALLY FOUND OUT)
 * because userscript managers are gay, but I'm not telling you.
 * Find it yourself and I'll probably get catgpt to do the migration,
 * since it requires reworking a LOT.
 * anyway, good luck finding a new detection ;)
 * you KNOW I spend lots of time trying to make this undetectable,
 * and the fact that you resorted to ERROR STACK DETECTIONS shows.
 * @module
 */

import { expose } from "@vape-rewrite/core";
// import DetectionDebugger from "@/features/modules/impl/utility/DetectionDebugger";
import { createProxy } from "@vape-rewrite/core";
import { Main } from "@wq2/narrow-one-types/src/game";

const w = (unsafeWindow ?? window) as typeof window;
const origBind = w.Function.prototype.bind;

export let main: Main | undefined;

export default function hook() {
	return new Promise<Main>((res) => {
		w.Function.prototype.bind = createProxy(origBind, {
			apply(target, thisArg, argArray: [thisArg: any, ...argArray: any[]]) {
				const ta = argArray[0];
				if (
					ta != null &&
					typeof ta === "object" &&
					"constructor" in ta &&
					"gameManager" in ta &&
					"boundLoop" in ta
				) {
					main = ta;
					w.Function.prototype.bind = origBind;
					res(ta);
					expose("main", () => main);
				}
				return Reflect.apply(target, thisArg, argArray);
			},
		});
	});
}

export const ready = hook();
