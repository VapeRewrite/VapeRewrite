/**
 * Makes an object for storing stuff if the debug flag is enabled
 * @module
 */

import { EXPOSE_SYMBOLS, LOG_EXPOSE_NAME } from "./debugControls";
import createProxy from "./utils/helpers/proxy";
import { MAIN_LOGGER as logger } from "./utils/logging/loggers";
import { exposedName } from "./utils/mapping/names";

export let store: object = {};

const EMPTY_FN = () => {};

function fakeEmptyFn<T extends Function>(f: T): T {
	return createProxy(EMPTY_FN, {
		apply(_, __, argArray) {
			return f(...argArray);
		},
	}) as unknown as T;
}
const origError = (unsafeWindow as typeof window).Error;
const {construct: origConstruct} = Reflect;
const {defineProperty} = Object;

const origStackGetter: (() => string) | undefined = (() => {
	const prop = Object.getOwnPropertyDescriptor(origConstruct(origError, []), "stack").get;
	if (!prop) return; // fallback to just getting it
	return prop;
})();

function getStack(err: Error) {
	return origStackGetter.bind(err)() as string;
}

function init() {
	if (!EXPOSE_SYMBOLS) return;
	defineProperty(unsafeWindow, exposedName, {
		get: fakeEmptyFn(() => {
			const err = origConstruct(origError, []);
			const stk = getStack(err);
			// lazy
			const fromDevTools = stk.includes("at <anonymous>") || stk.includes("debugger eval code");
			if (!fromDevTools) return;
			return store;
		}),
		configurable: false,
		enumerable: false
	});
	if (LOG_EXPOSE_NAME) logger.info("Symbol expose store name:", exposedName);
}
export function expose(name: string, value: () => unknown) {
	if (!EXPOSE_SYMBOLS) return;
	store[name] = value();
}

init();
