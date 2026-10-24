/**
 * Abuses the horrid field remapping system Kirka.io uses to give us free names.
 * @module
 */

import { ready as strs } from "@/utils/strings";
import { expose } from "@vape-rewrite/core";

// const REGEX = /[wmn]{3,}/i;
const nameMap: Record<string, string> = {};

export default async function init() {
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
	}
	b: {
		// ws does not work in the browser. Browser clients must use the native WebSocket object
		const s = strings.find(x => x.startsWith("ws does not work in the "));
		if (!s) break b;
		const m = /does not work in the [wmn]{3,}\. [wmn]{3,} ([wmn]{3,}) must use the native/i.exec(s);
		if (!m) break b;
		nameMap.clients = m[1];
	}
	c: {
		// WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.
		const s = strings.find(x => x.startsWith("WARNING: OrbitControls.js en") && x.endsWith("type - dolly/zoom disabled."));
		if (!s) break c;
		const m = /WARNING: OrbitControls\.js en([wmn]{3,})ed an unknown ([wmn]{3,}) type - dolly\/zoom disabled\./i.exec(s);
		if (!m) break c;
		nameMap.counter = m[1];
		nameMap.camera = m[2];
	}
	expose("nameMap", () => nameMap);
}

export const ready = init();