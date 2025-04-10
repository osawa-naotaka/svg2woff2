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
