import { createProxy, expose } from "@vape-rewrite/core";
import { mod } from "../wrappers/vendor/three";
export { ready } from "../wrappers/vendor/three";

const THREE: typeof mod = createProxy({} as typeof mod, {
	get(_, p) {
		if (!mod) {
			throw new Error("three refs accessed before ThreeJS references pulled");
		}
		return Reflect.get(mod, p, mod);
	}
});
export default THREE;
expose("THREE", () => THREE);