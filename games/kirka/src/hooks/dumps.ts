/**
 * Abuses the horrid field remapping system Kirka.io uses to give us free names.
 * @module
 */

import { ready as strs } from "@/utils/strings";
import { gameScript, gameScriptReady } from "@/hooks/gameScript";
import { expose } from "@vape-rewrite/core";

const nameMap: Record<string, string> = {};

// Populated at runtime from the bundle (never hardcoded).
export const DUMP_STRINGS: Record<string, string> = {};

export type DumpKey =
	| "x"
	| "y"
	| "z"
	| "browser"
	| "environment"
	| "clients"
	| "counter"
	| "camera";

export const MATCHED_DUMPS = {} as Record<DumpKey, string>;

function discoverField(code: string, regex: RegExp): string | undefined {
	return regex.exec(code)?.[1];
}

async function init() {
	await gameScriptReady;
	const { result: strings } = await strs;

	// kirka developers incompetence :money_mouth:
	// the fact that it replaces debug/error strings is wild.
	// but hey, at least that's good for me, because its easier to handle!
	a: {
		// vue-style-loader cannot be used in a non-browser environment. Use { target: 'node' } in your Webpack config to indicate a server-rendering environment.
		const s = strings.find(x => x.startsWith("vue-style-loader cannot be used in a non-"));
		if (!s) break a;
		const m = /in a non-([wmn]{3,}) ([wmn]{3,})\./i.exec(s);
		if (!m) break a;
		nameMap.browser = m[1];
		nameMap.environment = m[2];
		MATCHED_DUMPS.browser = m[1];
		MATCHED_DUMPS.environment = m[2];
	}
	b: {
		// ws does not work in the browser. Browser clients must use the native WebSocket object
		const s = strings.find(x => x.startsWith("ws does not work in the "));
		if (!s) break b;
		const m = /does not work in the [wmn]{3,}\. [wmn]{3,} ([wmn]{3,}) must use the native/i.exec(s);
		if (!m) break b;
		nameMap.clients = m[1];
		MATCHED_DUMPS.clients = m[1];
	}
	c: {
		// WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.
		const s = strings.find(x => x.startsWith("WARNING: OrbitControls.js en") && x.endsWith("type - dolly/zoom disabled."));
		if (!s) break c;
		const m = /WARNING: OrbitControls\.js en([wmn]{3,})ed an unknown ([wmn]{3,}) type - dolly\/zoom disabled\./i.exec(s);
		if (!m) break c;
		nameMap.counter = m[1];
		nameMap.camera = m[2];
		MATCHED_DUMPS.counter = m[1];
		MATCHED_DUMPS.camera = m[2];
	}

	// Discover the Vector3 component field names without hardcoding them.
	// Three.js-style vector fields are identified by their setX/setY/setZ methods.
	const threeX = discoverField(gameScript, /setX\(\w+\)\s*\{\s*this\.(\w+)\s*=/);
	const threeY = discoverField(gameScript, /setY\(\w+\)\s*\{\s*this\.(\w+)\s*=/);
	const threeZ = discoverField(gameScript, /setZ\(\w+\)\s*\{\s*this\.(\w+)\s*=/);

	// The game's (possibly different) vector fields fall back to the Three.js
	// fields when undefined, which identifies which is x/y/z.
	const fallbackRe = /(\w+) !== undefined \? (?:\w+\.)?\1 : (?:\w+\.)?(\w+)/g;
	let match: RegExpExecArray | null;
	while ((match = fallbackRe.exec(gameScript)) !== null) {
		const posField = match[1];
		const threeField = match[2];
		if (threeField === threeX && threeX && !MATCHED_DUMPS.x && strings.includes(posField)) {
			MATCHED_DUMPS.x = posField;
			DUMP_STRINGS.x = posField;
		}
		if (threeField === threeY && threeY && !MATCHED_DUMPS.y && strings.includes(posField)) {
			MATCHED_DUMPS.y = posField;
			DUMP_STRINGS.y = posField;
		}
		if (threeField === threeZ && threeZ && !MATCHED_DUMPS.z && strings.includes(posField)) {
			MATCHED_DUMPS.z = posField;
			DUMP_STRINGS.z = posField;
		}
	}

	expose("nameMap", () => nameMap);
	expose("dumps", () => MATCHED_DUMPS);
}

export const ready = init();

export default async function initDefault() {
	return ready;
}