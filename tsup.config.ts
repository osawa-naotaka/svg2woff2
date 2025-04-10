import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        "svg2woff2": "src/main.ts",
    },
    sourcemap: true,
    minify: true,
    splitting: false,
    clean: true,
    dts: true,
    format: ["esm"],
    outDir: "dist",
});
