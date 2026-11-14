// import { Cancelable } from "@vape-rewrite/core";
// import { showNotification } from "@vape-rewrite/ui-api";
// import { createProxy } from "@vape-rewrite/core";

// import Bus from "@/Bus";
import /*Refs, */{ anyReady } from "@/utils/refs/game";

// let origStepVelocity: () => void;

// TODO
export default function hookStepVelocity() {
	// const { player } = Refs;
	// if (!player) {
	// 	showNotification("Hook", "No player, can't hook stepVelocity", "alert", 0.5e3);
	// 	return;
	// }
	// const rBody = Object.getPrototypeOf(player.rigidBody);
	// origStepVelocity = rBody.stepVelocity;
	// rBody.stepVelocity = createProxy(origStepVelocity, {
	// 	apply(target, thisArg, argArray) {
	// 		// `player` could be outdated
	// 		if (!thisArg.player.hasOwnership) return Reflect.apply(target, thisArg, argArray);
	// 		const c = new Cancelable();
	// 		Bus.emit("preStepVelocity", c);
	// 		if (!c.canceled) {
	// 			const result = Reflect.apply(target, thisArg, argArray);
	// 			Bus.emit("postStepVelocity");
	// 			return result;
	// 		}
	// 	},
	// });
}
anyReady.then(() => {
	hookStepVelocity();
});
