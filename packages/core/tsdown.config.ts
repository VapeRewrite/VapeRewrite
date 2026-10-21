import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/index.ts"],
	target: "esnext",
	platform: "browser",
	minify: "dce-only",
	sourcemap: true,
});
