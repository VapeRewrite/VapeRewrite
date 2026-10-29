import three from "@/utils/refs/three";
import { ready } from "./gameHook";
import { createProxy } from "@vape-rewrite/core";

let origGetDelta: () => number, origProto: typeof three["currentClock"], lastDelta = 0;

ready.then(() => {
	origProto = three.Clock.prototype;
	origGetDelta = origProto.getDelta;
	origProto.getDelta = createProxy(origGetDelta, {
		apply(target, thisArg, argArray: []) {
			const result = Reflect.apply(target, thisArg, argArray);
			lastDelta = result;
			return result;
		},
	});
});
export default {
	get d() {
		return lastDelta;
	}
}