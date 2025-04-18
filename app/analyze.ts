import { load } from "opentype.js";

const font = await load("app/fa-brands-400.ttf");
console.log(font);
