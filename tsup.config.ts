import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	dts: true,
	format: ["esm"],
	minify: false,
	sourcemap: true,
	treeshake: true,
});
