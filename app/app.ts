import { createRequire } from "node:module";
import path from "node:path";
import { svg2woff2 } from "../src/main.js";

const require = createRequire(import.meta.url);

// テストコード
const base_dir = path.join(path.dirname(require.resolve("@fortawesome/fontawesome-free/package.json")), "svgs/solid/");
const font_family = "hanabi generated font";
const output_file = "hf-builtin-400.woff2";
const svg_files = ["0", "1", "2"]; // indicate ./svg/0.svg, ./svg/1.svg, ./svg/2.svg

const { woff2, css } = svg2woff2(svg_files, { base_dir, font_family, output_file });

console.log("Generated WOFF2 Data:", woff2);
console.log("Generated CSS:", css);
