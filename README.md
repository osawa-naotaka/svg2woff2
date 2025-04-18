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
- **ViewBox Preservation**: Option to maintain the original SVG viewBox dimensions

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
    // Optional parameters with defaults:
    // units_per_em: 1024,
    // ascent: 1024,
    // descent: 0,
    // offset_y: 0,
    // height_decrese: 0,
    // preserve_viewbox: true
  },
  ttf_font_opt: {
    version: "1.0",
    description: "My custom icon font",
    url: "https://example.com"
  }
};

// Generate WOFF2 font
const woff2Buffer = await svg2woff2(svgs, options);

// Generate corresponding CSS
const css = generateCss(svgs, {
  font_family: "my-icons",
  font_url: "my-icons.woff2",
  // Optional:
  // vertical_align: "-0.125em" // If not specified, no CSS vertical-align property will be set
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

// Configure font parameters - only font_family is required
const svg_font_opt: SvgFontParameters = {
  font_family: "custom-brands",
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

#### `svg2ttf(svgs, options)`

Converts SVG icons to a TTF font.

- **Parameters**:
  - `svgs`: Array of `Svg` objects containing `name` and `content`
  - `options`: Configuration object with `svg_font_opt` and `ttf_font_opt`
- **Returns**: Promise resolving to a Buffer containing the TTF font data

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
  font_family: string;         // Font family name (required)
  units_per_em?: number;       // Font units per em (default: 1024)
  ascent?: number;             // Font ascent (default: units_per_em)
  descent?: number;            // Font descent (default: 0)
  offset_y?: number;           // Vertical offset(unit) of final glyph (default: 0)
  height_decrese?: number;     // Height(unit) decreased from units_per_em (default: 0)
  preserve_viewbox?: boolean;  // Whether to preserve the original SVG viewBox (default: true)
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
  font_family: string;        // Font family name
  font_url: string;           // URL to the font file
  unicode_base?: number;      // Starting Unicode codepoint (default: 0xe000)
  vertical_align?: string;    // Font vertical alignment (if not specified, no vertical-align CSS property will be set)
}
```

#### `Svg2Woff2Options`

```typescript
interface Svg2Woff2Options {
  ttf_font_opt: TtfFontParameters;
  svg_font_opt: SvgFontParameters;
  unicode_base?: number;      // Starting Unicode codepoint (default: 0xe000)
}
```

## How It Works

1. SVG strings are parsed and converted to SVG path data
2. Paths are transformed to adapt to font metrics
3. An SVG font is created from the path data
4. The SVG font is converted to TTF
5. The TTF font is compressed to WOFF2 (for woff2 output)

### ViewBox Preservation

When `preserve_viewbox` is set to `true` (default), the library will use the original SVG viewBox dimensions for scaling and positioning the glyph. This maintains the proportions and aspect ratio of the original SVG.

If set to `false` or if no viewBox is present, the library will calculate the bounding box of the path and use that for scaling.

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
