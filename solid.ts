/**
 * Uses `@solid/compiler` for cat petting.
 * @todo takes like 200+ milliseconds to build, while they say it takes ~19ms to build. Either its because its running under WASM or something with it is wrong
 * @module
 */

import type { TransformOptions } from "@solidjs/compiler";
import type { Plugin } from "rolldown";

/**
 * Rolldown plugin for SolidJS using OXC-based compiler
 */
export default function solidOxc(solid: TransformOptions = {}): Plugin {
	// Lazy load the native module
	let compiler: typeof import("@solidjs/compiler") | null = null;

	return {
		name: "rolldown-plugin-solid-oxc",

		buildStart: {
			order: "post",
			async handler() {
				try {
					compiler = await import("@solidjs/compiler");
				} catch (e) {
					this.error(`Failed to load SolidJS compiler: ${e}`);
				}
			},
		},

		// Use Rolldown's native hook filter for optimal performance
		// Rolldown skips calling the plugin entirely for non-matching files
		transform: {
			filter: {
				moduleType: ["jsx", "tsx"]
			},
			async handler(code: string, id: string) {
				if (!compiler) this.error("solid-jsx-oxc module not loaded");

				try {
					const result = await compiler!.transformAsync(code, {
						...solid,
						filename: id,
						sourceMap: false,
					});

					return {
						code: result.code,
						map: result.map ? JSON.parse(result.map) : null,
					};
				} catch (e: unknown) {
					const message = e instanceof Error ? e.message : String(e);
					this.error(`Failed to transform ${id}: ${message}`);
				}
			},
		},
	};
}
