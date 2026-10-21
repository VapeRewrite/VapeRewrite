import { defineConfig } from "tsdown";
import solid from "../../solid.ts";

export default defineConfig({
	entry: ["./src/index.ts"],
	target: "esnext",
	platform: "browser",
	minify: "dce-only",
	sourcemap: true,
	css: { minify: true },
	plugins: [solid()],
	// inputOptions: {
	// 	plugins
	// }
});
