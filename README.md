# svg2woff2

## Usage

```typescript
import { svg2woff2 } from 'svg2woff2';

const base_dir = "./svg/";
const font_family = "hanabi generated font";
const output_file = "hf-builtin-400.woff2";
const svg_files = ["a", "b", "c"];  // indicate ./svg/a.svg, ./svg/b.svg, ./svg/c.svg

const { woff2, css } = svg2woff2(svg_files, { base_dir, font_family, output_file });

// write woff2 binary date(maybe type Buffer?) and css to files.
```

output css is:

```css
@font-face {
    font-family: 'hanabi generated font';
    font-style: normal;
    font-weight: 400;
    font-display: block;
    src: url("../fonts/hf-builtin-400.woff2") format("woff2");
}

.hf::before { content: var(--hf); }
.hf-a { --hf: "\e000"; }
.hf-b { --hf: "\e001"; }
.hf-c { --hf: "\e002"; }
```

usage in html is:

```html
<i class="hf hf-a"></i>
```

## internal functions

### svgFilesToSvgFont

```typescript
const base_dir = "./svg/";
const svg_files = ["a", "b", "c"];  // indicate ./svg/a.svg, ./svg/b.svg, ./svg/c.svg

const svg_font = svgFilesToSvgFont(svg_files, { base_dir });
```

- svgFilesToSvgFont(svg_files: string[], opt : { base_dir: string }): string

inputs:
  - svg_files - array of string, each item indicates svg file name. i.e. "a" indicates "a.svg"
  - opt
    - base_dir - base directory to svg file. fullpath = `path.join(base_dir, svg_files[n] + ".svg")`

output:
  - string of XML represents SVG font.

### svg2ttf

we use npm package [svg2ttf](https://www.npmjs.com/package/svg2ttf).

- svg2ttf(svgFontString, options) -> buf

inputs:
  - svgFontString - SVG font content
  - options
    - copyright - copyright string (optional)
    - description - description string (optional)
    - ts - Unix timestamp (in seconds) to override creation time (optional)
    - url - manufacturer url (optional)
    - version - font version string, can be Version x.y or x.y.

output:
  - buf - internal byte buffer object, similar to DataView. It's buffer property is Uin8Array or Array with ttf content.

output buffer is [microbuffer](https://github.com/fontello/microbuffer)

### ttf2woff2

we use npm package [ttf2woff](https://www.npmjs.com/package/ttf2woff2)

```typescript
import ttf2woff2 from 'ttf2woff2';

const woff2 = ttf2woff2(input);
```

input and output of `ttf2woff2` may be Uint8Array or Array?

### generateCss

- generateCss(opt: { font_family: string, url: string, glyphs: string[], unicode_base: number }): string

inputs:
  - opt
    - font_family - font-famiry property
    - url - src url
    - glyphs - array of string indicates each glyph
    - unicode_base - unicode base value, is incremented for each glyph

output:
  - CSS string

```typescript
const font_family = "hanabi generated font";
const url = "../fonts/hf-builtin-400.woff2";
const glyphs = ["a", "b", "c"];
const unicode_base = 0xe000;

const css = generateCss({ font_family, url, glyphs, unicode_base });
```

```css
@font-face {
    font-family: 'hanabi generated font';
    font-style: normal;
    font-weight: 400;
    font-display: block;
    src: url("../fonts/hf-builtin-400.woff2") format("woff2");
}

.hf::before { content: var(--hf); }
.hf-a { --hf: "\e000"; }
.hf-b { --hf: "\e001"; }
.hf-c { --hf: "\e002"; }
```
