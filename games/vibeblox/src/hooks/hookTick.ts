/**
 * No easy way to hook the tick function, so.
 * @module
 */

import { Cancelable, createProxy } from "@vape-rewrite/core";
import Bus from "@/Bus";

let origAnimationFrame = unsafeWindow.requestAnimationFrame;
let n: number;
unsafeWindow.requestAnimationFrame = createProxy(origAnimationFrame, {
	apply(target, thisArg, argArray: [callback: FrameRequestCallback]) {
		const c = new Cancelable();
		Bus.emit("preTick", c);
		if (c.canceled) return n;
		try {
			const result = Reflect.apply(target, thisArg, argArray) as number;
			n = result;
			return result;
		} finally {
			Bus.emit("postTick");
		}
	},
});