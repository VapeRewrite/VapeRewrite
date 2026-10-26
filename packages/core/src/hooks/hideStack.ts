import createProxy from "../utils/helpers/proxy";
import { parseStack, reconstructStack, Stack } from "../utils/helpers/stackParser";
import { PATCH_LOGGER } from "../utils/logging/loggers";

const w = unsafeWindow as typeof window;

const origError = w.Error;
const { defineProperty, getOwnPropertyDescriptor } = Object;

const origDesc = getOwnPropertyDescriptor(new origError, "stack");

function removeOurLocations(trace: Stack[]): Stack[] {
	return trace.filter((x) => {
		const {
			at: { path },
		} = x;
		return !path.startsWith("chrome-extension://") && !path.includes("<debug>");
	});
}

export default function hook() {
	w.Error = createProxy(origError, {
		construct(target, argArray, newTarget) {
			const c = Reflect.construct(target, argArray, newTarget);
			defineProperty(c, "stack", {
				...origDesc,
				get() {
					const origTrace = origDesc.get.bind(c)() as string;
					const parsed = parseStack(c, origTrace);
					const modified = removeOurLocations(parsed);
					const output = reconstructStack(modified);
					// PATCH_LOGGER.info("original trace vs modified trace", origTrace, output);
					return output;
				},
			});
			return c;
		},
	});
}
