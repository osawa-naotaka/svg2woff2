# svg2woff2

A lightweight TypeScript library for bundling SVG icons into WOFF2 fonts. Simple, modern, and focused on the most widely supported font format.

[![NPM version](https://img.shields.io/npm/v/svg2woff2.svg)](https://www.npmjs.com/package/svg2woff2)
[![License](https://img.shields.io/npm/l/svg2woff2.svg)](https://github.com/osawa-naotaka/svg2woff2/blob/main/LICENSE)

## Features

- **Simple API**: Convert SVG strings directly to WOFF2 without temporary files
- **Modern Focus**: Targets WOFF2 only, the most efficient and widely supported web font format
- **No File I/O Dependencies**: Works with strings and buffers, allowing integration with any I/O system
- **Full TypeScript Support**: Complete type definitions for a seamless development experience
- **CSS Generation**: Automatically generates CSS for using your custom icons

## Installation

```bash
npm install svg2woff2
# or
yarn add svg2woff2
```

## Usage

### Basic Example

```typescript
import { svg2woff2, generateCss } from "svg2woff2";
import { writeFileSync } from "fs";

// Your SVG strings
const svgs = [
  { 
    name: "icon1", 
    content: '<svg viewBox="0 0 24 24">...</svg>' 
  },
  { 
    name: "icon2", 
    content: '<svg viewBox="0 0 24 24">...</svg>' 
  }
];

// Configure font parameters
const options = {
  svg_font_opt: {
    font_family: "my-icons",
    ascent: 512,
    descent: 0,
    units_per_em: 512,
    offset_y: 0,
    height_decrese: 0,
  },
  ttf_font_opt: {
    version: "1.0",
    description: "My custom icon font",
    url: "https://example.com",
    vertical_align: "-0.125em",
  }
};

// Generate WOFF2 font
const woff2Buffer = await svg2woff2(svgs, options);

// Generate corresponding CSS
const css = generateCss(svgs, {
  font_family: "my-icons",
  font_url: "my-icons.woff2"
});

// Write files (if needed)
writeFileSync("my-icons.woff2", woff2Buffer);
writeFileSync("my-icons.css", css);
```

### Real-world Example with Font Awesome

The following example shows how to convert Font Awesome SVG icons to a WOFF2 font:

```typescript
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { cwd } from "node:process";
import { generateCss, svg2woff2 } from "svg2woff2";
import type { GenerateCssOptions, SvgFontParameters, TtfFontParameters } from "svg2woff2";

const require = createRequire(import.meta.url);

// Read SVG files from Font Awesome
const base_dir = path.join(
  path.dirname(require.resolve("@fortawesome/fontawesome-free/package.json")), 
  "svgs/brands/"
);
const svg_files = ["youtube", "github", "x-twitter"];
const svgs = svg_files.map((name) => {
  const filepath = path.join(base_dir, `${name}.svg`);
  const content = readFileSync(filepath, "utf8");
  return { name, content };
});

// Configure font parameters
const svg_font_opt: SvgFontParameters = {
  font_family: "custom-brands",
  ascent: 0,
  descent: 512,
  units_per_em: 512,
  offset_y: 0,
  height_decrese: 0,
};

const ttf_font_opt: TtfFontParameters = {
  version: "1.0",
  description: "Custom brand icons font",
  url: "https://github.com/your-username/your-project",
};

const css_opt: GenerateCssOptions = {
  font_family: svg_font_opt.font_family,
  font_url: "custom-icons.woff2",
  vertical_align: "-0.125em",
};

// Generate WOFF2 font and CSS
const woff2 = await svg2woff2(svgs, { svg_font_opt, ttf_font_opt });
const css = generateCss(svgs, css_opt);

// Write to files
const output_dir = path.join(cwd(), "build");
if (!existsSync(output_dir)) {
  mkdirSync(output_dir);
}
writeFileSync(path.join(output_dir, css_opt.font_url), woff2);
writeFileSync(path.join(output_dir, "font.css"), css);
```

## API Reference

### Main Functions

#### `svg2woff2(svgs, options)`

Converts SVG icons to a WOFF2 font.

- **Parameters**:
  - `svgs`: Array of `Svg` objects containing `name` and `content`
  - `options`: Configuration object with `svg_font_opt` and `ttf_font_opt`
- **Returns**: Promise resolving to a Buffer containing the WOFF2 font data

#### `generateCss(svgs, options)`

Generates CSS for using the generated font with class names.

- **Parameters**:
  - `svgs`: Array of `Svg` objects that were used to generate the font
  - `options`: CSS generation options
- **Returns**: CSS string for using the font

### Types

#### `Svg`

```typescript
interface Svg {
  name: string;       // Icon name (used for CSS class generation)
  content: string;    // SVG content as string
}
```

#### `SvgFontParameters`

```typescript
interface SvgFontParameters {
  font_family: string;   // Font family name
  ascent: number;        // Font ascent
  descent: number;       // Font descent
  units_per_em: number;  // Font units per em
  offset_y: number;      // Horizontal offset(unit) of final glyph
  hight_decrese: number; // Hight(unit) decresed from units_per_em
}
```

#### `TtfFontParameters`

```typescript
interface TtfFontParameters {
  version: string;        // Font version
  description: string;    // Font description
  url: string;            // Font homepage URL
}
```

#### `GenerateCssOptions`

```typescript
interface GenerateCssOptions {
  font_family: string;    // Font family name
  font_url: string;       // URL to the WOFF2 font file
  unicode_base?: number;  // Starting Unicode codepoint (default: 0xe000)
  vertical_align: string; // Font vertical alignment
}
```

#### `Svg2Woff2Options`

```typescript
interface Svg2Woff2Options {
  ttf_font_opt: TtfFontParameters;
  svg_font_opt: SvgFontParameters;
}
```

## How It Works

1. SVG strings are parsed and converted to SVG path data
2. Paths are transformed to adapt to font metrics
3. An SVG font is created from the path data
4. The SVG font is converted to TTF
5. The TTF font is compressed to WOFF2

## Browser Usage

While the library itself doesn't include browser-specific code, the generated WOFF2 fonts and CSS can be used in web applications:

```html
<link rel="stylesheet" href="font.css">
<i class="hf hf-github"></i>
<i class="hf hf-youtube"></i>
```

## Development

```bash
# Install dependencies
yarn install

# Build the library
yarn build

# Run the example
yarn dev

# Run tests
yarn test
```

## License

MIT

## Credits

svg2woff2 uses the following libraries:
- [svgson](https://github.com/elrumordelaluz/svgson)
- [element-to-path](https://github.com/elrumordelaluz/element-to-path)
- [svg-path-commander](https://github.com/thednp/svg-path-commander)
- [svg2ttf](https://github.com/fontello/svg2ttf)
- [ttf2woff2](https://github.com/nfroidure/ttf2woff2)
