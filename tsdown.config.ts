import { defineConfig } from "tsdown";

export default defineConfig({
    entry: {
        "svg2woff2": "src/main.ts",
    },
    sourcemap: true,
    minify: true,
    fixedExtension: false,
    clean: true,
    dts: true,
    format: ["esm"],
    outDir: "dist",
  target: false,
});
