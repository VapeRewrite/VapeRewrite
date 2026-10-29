import hookDelta from "@/hooks/hookDelta";
import type { Clock } from "three";

let clockConstructor: typeof Clock, lastConstructedClock: Clock;

Object.defineProperty(Object.prototype, "autoStart", {
	configurable: true,
	enumerable: false,
	get() {
		const ts = this as Clock;
		console.log("autoStart accessed:", ts);
		clockConstructor = ts.constructor as typeof Clock;
		lastConstructedClock = ts;
		delete Object.prototype["autoStart"];
		return true;
	},
	set(v) {
		console.log("autoStart set:", this);
	},
});

export default {
	get Clock(): typeof Clock {
		return clockConstructor;
	},
	get lastDelta() {
		return hookDelta.d;
	},
	get currentClock(): Clock {
		return lastConstructedClock;
	}
};