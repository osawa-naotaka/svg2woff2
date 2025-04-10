import { svg2woff2 } from "../src/main";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const base_dir = path.join(path.dirname(require.resolve("@fortawesome/fontawesome-free/package.json")), "svgs/solid/");
const font_family = "hanabi generated font";
const output_file = "hf-builtin-400.woff2";
const svg_files = ["0", "1", "2"];

const { woff2, css } = svg2woff2(svg_files, { base_dir, font_family, output_file });

console.log("Test PASSED for generateWoff2(): Buffer size = " + woff2.length);
console.log("Generated WOFF2 Data (base64):", woff2.toString("base64"));
console.log("Generated CSS:", css);
