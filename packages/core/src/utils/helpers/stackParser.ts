/**
 * its ALL catgpt because I'm lazy and its 11:49 PM
 * let me go to sleep :(
 * I did try initially and I did implement SpiderMonkey/Firefox stack trace parsing since
 * it was very minimal, but the V8 stack trace is 20x more complicated to parse
 * @module
 */

const { browserName = "" } = GM.info.platform;

const isV8 = /Chrome|Chromium|Edge|Opera|Brave|Vivaldi/i.test(browserName);
const isFF = /Firefox/i.test(browserName);
const isSafari = /Safari/i.test(browserName) && !/Chrome|Chromium|Edge|Opera/i.test(browserName);
const isMinimalStack = isFF || isSafari;

//const devtoolsThingy = isV8 ? "<anonymous>" : isFF ? "debugger eval code" : undefined;

export interface Stack {
	fnName: string;
	at: {
		/** `<debug>` represents a devtools `<anonymous>` location. */
		path: string;
		line: number;
		column: number;
	};
}

const origParseInt = parseInt;

const ANONYMOUS = "<anonymous>";
const DEBUG_PATH = "<debug>";

/**
 * Parse a location from the end of a string.
 *
 * Greedy matching intentionally uses the LAST numeric :line:column suffix,
 * so URLs containing ports and other colons work correctly.
 */
function parseLocation(value: string): { path: string; line: number; column: number } | undefined {
	const match = /^(.*):(\d+):(\d+)\)?$/.exec(value.trim());

	if (!match) return undefined;

	const [, rawPath, rawLine, rawColumn] = match;
	const line = origParseInt(rawLine, 10);
	const column = origParseInt(rawColumn, 10);

	if (!Number.isSafeInteger(line) || !Number.isSafeInteger(column) || line < 0 || column < 0) {
		return undefined;
	}

	let path = rawPath;

	// Normalize the path without damaging URL parentheses.
	if (path === ANONYMOUS) {
		path = DEBUG_PATH;
	}

	return { path, line, column };
}

/**
 * Remove a function wrapper around a location when present.
 *
 * Example:
 *   "myFunction (https://example.com/a.js:10:5)"
 */
function parseV8Frame(value: string): Stack | undefined {
	let frame = value.trim().replace(/^at\s+/, "");

	if (!frame) return undefined;

	// A V8 frame may be either:
	//   functionName (path:line:column)
	//   path:line:column
	//   async functionName (path:line:column)
	//
	// Parse the numeric location suffix first, rather than splitting on ":".
	const match = /^(.*):(\d+):(\d+)\)?$/.exec(frame);

	if (!match) return undefined;

	const location = parseLocation(frame);
	if (!location) return undefined;

	let prefix = match[1].trim();
	let fnName = ANONYMOUS;
	let path = location.path;

	// A parenthesized location normally separates the function name from
	// the source path. Using the final " (" also handles many nested eval
	// frame formats without splitting URLs.
	const separator = prefix.lastIndexOf(" (");

	if (separator !== -1) {
		fnName = prefix.slice(0, separator).trim() || ANONYMOUS;
		path = prefix.slice(separator + 2).trim();

		// A path may have been captured with an unmatched opening wrapper.
		// Do not remove legitimate parentheses from the path itself.
	} else {
		// If there is no function wrapper, the whole prefix is the path.
		path = prefix;
	}

	if (!path) return undefined;

	if (path === ANONYMOUS) {
		path = DEBUG_PATH;
	}

	// V8 sometimes prefixes frames with "async", "new", or "await".
	// Keep these prefixes because they are meaningful stack information.

	return {
		fnName,
		at: {
			path,
			line: location.line,
			column: location.column,
		},
	};
}

/**
 * Parse Firefox/Safari-style stack frames:
 *
 *   functionName@path:line:column
 *   @path:line:column
 *   path:line:column
 */
function parseMinimalFrame(value: string): Stack | undefined {
	const frame = value.trim();
	if (!frame) return undefined;

	const separator = frame.indexOf("@");

	let fnName = ANONYMOUS;
	let locationText = frame;

	if (separator !== -1) {
		fnName = frame.slice(0, separator).trim() || ANONYMOUS;
		locationText = frame.slice(separator + 1).trim();
	}

	const location = parseLocation(locationText);
	if (!location) return undefined;

	return {
		fnName,
		at: location,
	};
}

/**
 * Parse an Error stack into a normalized representation.
 *
 * Invalid and non-frame lines are skipped instead of throwing, since browser
 * stack traces can include native frames and browser-specific metadata.
 */
export function parseStack(err: Error, stack: string): Stack[] {
	if (!stack || typeof stack !== "string") return [];

	let lines = stack.split(/\r?\n/);

	// Remove the Error header only if it matches this error.
	// Do not assume the header has a fixed length.
	const header = err.toString();

	if (lines.length > 0 && lines[0].trim() === header) {
		lines = lines.slice(1);
	} else if (
		lines.length > 0 &&
		/^(?:Error|TypeError|ReferenceError|RangeError|SyntaxError|EvalError|URIError|AggregateError)(?::|$)/.test(
			lines[0].trim(),
		)
	) {
		lines = lines.slice(1);
	}

	const result: Stack[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		let frame: Stack | undefined;

		// Detect the actual frame format as well as the current browser.
		// This also supports stacks produced by a different browser.
		if (/^at\s+/.test(trimmed)) {
			frame = parseV8Frame(trimmed);
		} else if (trimmed.includes("@")) {
			frame = parseMinimalFrame(trimmed);
		} else {
			// Some Safari frames omit a function name and use a bare location.
			frame = parseMinimalFrame(trimmed);
		}

		if (frame) result.push(frame);
	}

	return result;
}

/**
 * Reconstruct a stack trace from normalized frames.
 *
 * Output uses the current browser's conventional format:
 *   V8:     "    at functionName (path:line:column)"
 *   Firefox/Safari: "functionName@path:line:column"
 *
 * The result contains frame lines only, not an Error header.
 */
export function reconstructStack(stk: Stack[]): string {
	return stk
		.map((frame) => {
			const {
				fnName = ANONYMOUS,
				at: { path, line, column },
			} = frame;

			const safeName = fnName || ANONYMOUS;
			const safePath = path === DEBUG_PATH ? ANONYMOUS : path;

			if (
				!safePath ||
				!Number.isSafeInteger(line) ||
				!Number.isSafeInteger(column) ||
				line < 0 ||
				column < 0
			) {
				throw new TypeError("Invalid normalized stack frame");
			}

			if (isV8) {
				// Bare V8 locations do not need a function wrapper.
				if (safeName === ANONYMOUS) {
					return `    at ${safePath}:${line}:${column}`;
				}

				return `    at ${safeName} (${safePath}:${line}:${column})`;
			}

			if (isMinimalStack) {
				return `${safeName === ANONYMOUS ? "" : safeName}@${safePath}:${line}:${column}`;
			}

			// Format detection fallback for unsupported browser names.
			return `    at ${safeName} (${safePath}:${line}:${column})`;
		})
		.join("\n");
}