import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	dts: true,
	format: ["esm"],
	minify: true,
	sourcemap: true,
	treeshake: true,
});
