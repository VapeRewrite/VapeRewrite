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
import { showNotification } from "@vape-rewrite/ui-api";
import type { Main } from "@wq2/narrow-one-types/src/game";

import { ranBefore } from "@/utils/runTiming";

const w = (unsafeWindow ?? window) as typeof window;
export const origFunction = w.Function;
const origBind = w.Function.prototype.bind;

export let main;

function instantMainHook(): Promise<Main> {
	const { promise, resolve: res } = Promise.withResolvers<Main>();
	w.Function.prototype.bind = createProxy(origBind, {
		apply(target, thisArg, argArray: [thisArg: any, ...argArray: any[]]) {
			const result = Reflect.apply(target, thisArg, argArray);
			const boundThis = argArray[0];
			if (
				boundThis &&
				typeof boundThis.init === "function"
			) {
				const ta = boundThis as Main;
				main = ta;
				expose("main", () => main);
				res(ta);
				Function.prototype.bind = origBind; // restore
			}
			return result;
		},
	});
	return promise;
}

export default function hook(): Promise<Main> {
	console.info("ran before?", ranBefore);
	return ranBefore ? instantMainHook() : Promise.reject("ran after game");
}

export const ready = hook();
