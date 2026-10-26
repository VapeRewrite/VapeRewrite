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
			f(...argArray);
		},
	}) as unknown as T;
}
const origError = Error;
const {construct: origConstruct} = Reflect;
const {includes: origIncludes} = String.prototype;
const {defineProperty} = Object;

const origStackGetter: (() => string) | undefined = (() => {
	const prop = Object.getOwnPropertyDescriptor(origError.prototype, "stack").get;
	if (!prop) return; // fallback to just getting it
	return prop;
})();

function getStack(err: Error) {
	return origStackGetter.bind(err)() as string;
}

function includes(s: string, search: string, pos?: number) {
	return (origIncludes.bind(s) as typeof origIncludes)(search, pos);
}

function init() {
	if (!EXPOSE_SYMBOLS) return;
	defineProperty(unsafeWindow, exposedName, {
		get: fakeEmptyFn(() => {
			const err = origConstruct(origError, []);
			const stk = getStack(err);
			const fromDevTools = includes(stk, "<anonymous>");
			if (!fromDevTools) return;
			return store;
		}),
		configurable: false,
		enumerable: false,
		writable: false
	});
	if (LOG_EXPOSE_NAME) logger.info("Symbol expose store name:", exposedName);
}
export function expose(name: string, value: () => unknown) {
	if (!EXPOSE_SYMBOLS) return;
	store[name] = value();
}

init();
