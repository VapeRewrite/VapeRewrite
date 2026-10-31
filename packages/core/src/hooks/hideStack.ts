import createProxy from "../utils/helpers/proxy";
import { parseStack, reconstructStack, type Stack } from "../utils/helpers/stackParser";

const w = unsafeWindow as typeof window;

const origError = w.Error;
const origProto = origError.prototype;
const { defineProperty, getOwnPropertyDescriptor } = Object;

const origDesc = getOwnPropertyDescriptor(new origError(), "stack");

function removeOurLocations(trace: Stack[]): Stack[] {
	return trace.filter((x) => {
		const {
			at: { path },
		} = x;
		return !path.startsWith("chrome-extension://") && !path.includes("<debug>");
	});
}

declare type V8Err = typeof globalThis.Error & {
	/** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/captureStackTrace */
	captureStackTrace(object: object, constructor?: Function): void;
};
const origCST =
	"captureStackTrace" in origError ? (origError as V8Err).captureStackTrace : undefined;

function handleStackTrace(trace: string) {
	const parsed = parseStack(undefined, trace);
	const modified = removeOurLocations(parsed);
	const output = reconstructStack(modified);
	return output;
}

export default function hook() {
	defineProperty(origProto, "stack", {
		...origDesc,
		get() {
			const ts = this as Error;
			const origTrace = origDesc.get.bind(ts)() as string;
			const parsed = parseStack(ts, origTrace);
			const modified = removeOurLocations(parsed);
			const output = reconstructStack(modified);
			return output;
		},
	});
	if ("captureStackTrace" in w.Error) {
		const V8e = w.Error as V8Err;
		V8e.captureStackTrace = createProxy(origCST, {
			apply(target, thisArg, argArray: [obj: object, constructor?: Function]) {
				const [obj, constructor] = argArray;
				const setHandler = (target: object, p: string | symbol, newValue: any, receiver: any) => {
					if (p === "stack") {
						const modified = handleStackTrace(newValue);
						return Reflect.set(target, p, modified, receiver);
					}
					return Reflect.set(target, p, newValue, receiver);
				};
				const proxiedObj = createProxy(obj, {
					set: setHandler,
				});
				return Reflect.apply(target, thisArg, [proxiedObj, constructor]);
			},
		});
	}
}
