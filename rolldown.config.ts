/// <reference types="@types/bun" />
import swc from "@wq2/rolldown-plugin-swc";
import { readPackageUp } from "read-package-up";
import { defineConfig, RolldownOptions, RolldownPlugin } from "rolldown";
import userscript from "rolldown-plugin-userscript";
import { withFilter } from "rolldown/filter";

import minifyCSS from "./cssMinifyPlugin";
import minify from "./minifyPlugin";
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
function defineGame(
	name: string,
	plugins?: RolldownPlugin[],
): RolldownOptions {
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
			// this MUST be before UserScript, so the comments from it won't be removed.
			IS_PROD ? minify({
				compress: false,
				mangle: false,
				codegen: {
					removeWhitespace: true
				}
			}) : undefined,
			userscript((meta: string) => {
				const newMeta = meta
					.replace("process.env.AUTHOR", packageJson.author?.name ?? "Unspecified")
					.replace("process.env.VERSION", packageJson.version)
					.replace("process.env.NAME", REAL_CLIENT_NAME)
					.replace("process.env.GAME", name);
				return newMeta;
			}),
		],
		transform: {
			typescript: {
				optimizeConstEnums: true,
				optimizeEnums: true,
				removeClassFieldsWithoutInitializer: true
			},
			assumptions: {
				setPublicClassFields: true,
				noDocumentAll: true,
				// ignoreFunctionLength: true,
				// objectRestNoSymbols: true,
				pureGetters: true
			},
		},

		output: {
			format: "iife",
			dir: `dist/${name}/`,
			entryFileNames: `${name}.user.js`,
			minify: IS_PROD ? {
				compress: true,
				mangle: true,
				codegen: {removeWhitespace: false}
			} : {
				codegen: {removeWhitespace: false},
				compress: {keepNames: {function: true, class: true}}
			},
			sourcemap: "inline",
		},
		tsconfig: `${FOLDER}/tsconfig.json`
	};
}

export default defineConfig([
	defineGame("miniblox"),
	defineGame("waybackhq", [thing()]),
	defineGame("narrowOne"),
	defineGame("classicNarrowOne"),
	defineGame("vibeblox"),
	defineGame("kirka")
]);
