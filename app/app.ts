import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { cwd } from "node:process";
import { svg2woff2 } from "../src/main";

const require = createRequire(import.meta.url);

const base_dir = path.join(path.dirname(require.resolve("@fortawesome/fontawesome-free/package.json")), "svgs/brands/");
const font_family = "hanabi generated font";
const output_file = "hf-builtin-400.woff2";
const svg_files = ["youtube", "github", "x-twitter"];

const { woff2, css } = svg2woff2(svg_files, { base_dir, font_family, output_file });

console.log(`Test PASSED for generateWoff2(): Buffer size = ${woff2.length}`);
console.log("Generated WOFF2 Data (base64):", woff2.toString("base64"));
console.log("Generated CSS:", css);

const output_dir = path.join(cwd(), "build");

writeFileSync(path.join(output_dir, output_file), woff2);
writeFileSync(path.join(output_dir, "font.css"), css);
