import { gameScript, gameScriptReady } from "@/hooks/gameScript";
import { expose } from "@vape-rewrite/core";
import type * as VMModule from "@vape-rewrite/strings-wasm";

async function load() {
	const wasmExports = (await import(
		"https://cdn.jsdelivr.net/npm/@vape-rewrite/strings-wasm@0.0.1/strings_wasm.js" as "@vape-rewrite/strings-wasm"
	)) as typeof VMModule & {
		default: (path?: { module_or_path: string }) => Promise<void>;
	};

	await wasmExports.default({
		module_or_path:
			"https://cdn.jsdelivr.net/npm/@vape-rewrite/strings-wasm@0.0.1/strings_wasm_bg.wasm",
	});

	return wasmExports;
}

async function init() {
	const wasmExports = await load();
	await gameScriptReady;
	const result = wasmExports.parse(gameScript);
	return { wasmExports, result };
}

export const ready = init();
expose("strings", () => ready);
