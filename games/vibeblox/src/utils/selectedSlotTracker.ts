import { ready } from "@/hooks/gameHook";
import { createProxy } from "@vape-rewrite/core";

const wrap = {
	_s: 1,
	get s() {
		return wrap._s;
	},
	set s(v) {
		wrap._s = v;
	}
}
ready.then((g) => {g.setSelectedSlot = createProxy(g.setSelectedSlot, {
	apply(target, thisArg, argArray: [slot: number]) {
		wrap._s = argArray[0];
		return Reflect.apply(target, thisArg, argArray);
	},
})});
export default wrap;