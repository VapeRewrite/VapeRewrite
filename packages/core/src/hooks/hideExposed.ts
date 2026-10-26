/**
 * Hides the exposed store from the game.
 * @module
 */

import { store } from "../exposed";
import createProxy from "../utils/helpers/proxy";
import { exposedName } from "../utils/mapping/names";

const w = unsafeWindow as typeof window;

function replaceAndCopyFunction<OP, OR>(oldFunc: (...args: OP[]) => OR, newFunc: (r: OR) => OR) {
	return createProxy(oldFunc, {
		apply(orig, origID, origArgs) {
			const result = orig.apply(origID, origArgs);
			newFunc(result);
			return result;
		},
		get(orig, prop, receiver) {
			return Reflect.get(orig, prop, receiver);
		},
	});
}

function spliceIt<T>(arr: T[], item: T): T[] | [] {
	const idx = arr.indexOf(item);
	if (idx === -1) return [];
	return arr.splice(idx, 1);
}

export default function hook() {
	w.Object.getOwnPropertyNames = replaceAndCopyFunction(Object.getOwnPropertyNames, (list) => {
		spliceIt(list, exposedName);
		return list;
	});

	w.Object.keys = replaceAndCopyFunction(w.Object.keys, (list) => {
		spliceIt(list, exposedName);
		return list;
	});
	w.Object.values = replaceAndCopyFunction(w.Object.values, (list) => {
		spliceIt(list, store);
		return list;
	});

	w.Object.getOwnPropertyDescriptors = replaceAndCopyFunction(
		w.Object.getOwnPropertyDescriptors,
		(l) => {
			delete l[exposedName];
			return l;
		},
	);
}
