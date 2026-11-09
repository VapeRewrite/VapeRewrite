import swc from "@wq2/rolldown-plugin-swc";
/// <reference types="@types/bun" />
import { readPackageUp } from "read-package-up";
import { defineConfig, type RolldownOptions, type RolldownPlugin } from "rolldown";
import userscript from "rolldown-plugin-userscript";
import { withFilter } from "rolldown/filter";

import minifyCSS from "./cssMinifyPlugin";
import solid from "./solid";
import thing from "./thingPlugin";

const { packageJson } = (await readPackageUp())!;

export const BUILD_DATE = new Date();
const IS_PROD = process.env.NODE_ENV === "production";

// on April 1st, Baby Oil Rewrite. otherwise, Vape Rewrite.
export const REAL_CLIENT_NAME =
	BUILD_DATE.getMonth() === 3 && BUILD_DATE.getDate() === 1
		? ("Baby Oil Rewrite" as const)
		: ("Vape Rewrite" as const);

/**
 * Required structure:
 * - `packages/name/src/index.ts` is the entrypoint
 * - tsconfig in `packages/name/tsconfig.json`
 */
function defineGame(name: string, plugins?: RolldownPlugin[]): RolldownOptions {
	const FOLDER = `games/${name}`;
	return {
		input: `${FOLDER}/src/index.ts`,
		platform: "browser",
		moduleTypes: {
			".css": "text",
		},
		plugins: [
			// Babel, ESBuild, and SWC supports 2023-11 decorators
			// ESBuild is written in Go (garbage collector) and Babel is written in JS (not native),
			// I chose SWC.
			withFilter(
				swc({
					jsc: {
						parser: { decorators: true, syntax: "typescript" },
						target: "esnext",
						transform: { decoratorVersion: "2023-11" },
						experimental: {
							disableAllLints: true,
						},
						assumptions: {
							arrayLikeIsIterable: true,
							constantReexports: true,
							constantSuper: true,
							ignoreFunctionLength: true,
							ignoreFunctionName: true,
							noClassCalls: true,
							noNewArrows: true,
							objectRestNoSymbols: true,
							setPublicClassFields: true,
							noDocumentAll: true,
							superIsCallableConstructor: true,
							setClassMethods: true,
							setComputedProperties: true,
							pureGetters: true,
							setSpreadProperties: true,
						},
					},
				}),
				// Only run this transform if the file contains a decorator (and if it's a JS or TS file).
				{
					transform: {
						code: ["@Subscribe", "@Bus.Subscribe"],
						moduleType: ["js", "ts", "jsx", "tsx"],
					},
				},
			),
			minifyCSS(),
			solid(),
			plugins,
			userscript({
				transform(meta: string) {
					const newMeta = meta
						.replace("process.env.AUTHOR", packageJson.author?.name ?? "Unspecified")
						.replace("process.env.VERSION", packageJson.version)
						.replace("process.env.NAME", REAL_CLIENT_NAME)
						.replace("process.env.GAME", name);
					return newMeta;
				},
				metadataExperiment: true
			}),
		],
		transform: {
			typescript: {
				optimizeConstEnums: true,
				optimizeEnums: true,
				removeClassFieldsWithoutInitializer: false,
			},
			assumptions: {
				setPublicClassFields: true,
				noDocumentAll: true,
				// ignoreFunctionLength: true,
				// objectRestNoSymbols: true,
				pureGetters: true,
			},
		},

		output: {
			format: "iife",
			dir: `dist/${name}/`,
			entryFileNames: `${name}.user.js`,
			minify: IS_PROD ? true : "dce-only",
			sourcemap: "inline",
		},
		optimization: { inlineConst: true, pifeForModuleWrappers: true },
		experimental: {
			attachDebugInfo: IS_PROD ? "none" : "simple",
			nativeMagicString: true,
			lazyBarrel: true,
		},
		tsconfig: `${FOLDER}/tsconfig.json`,
	};
}

export default defineConfig([
	defineGame("miniblox"),
	defineGame("waybackhq", [thing()]),
	defineGame("narrowOne"),
	defineGame("classicNarrowOne"),
	defineGame("vibeblox"),
	defineGame("kirka"),
]);
