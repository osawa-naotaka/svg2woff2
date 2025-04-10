import { readFileSync } from "node:fs";
import path from "node:path";
import svg2ttf from "svg2ttf";
import ttf2woff2 from "ttf2woff2";

interface Svg2Woff2Options {
    base_dir: string;
    font_family: string;
    output_file: string;
}

interface GenerateCssOptions {
    font_family: string;
    url: string;
    glyphs: string[];
    unicode_base: number;
}

/**
 * Convert SVG files to SVG font
 * @param svg_files Array of SVG file names without extension
 * @param opt Options including base directory
 * @returns SVG font as string
 */
export function svgFilesToSvgFont(svg_files: string[], opt: { base_dir: string }): string {
    const glyphs: Array<{
        path: string;
        name: string;
        unicode: string;
        width: number;
        height: number;
        viewBox: { minX: number; minY: number; width: number; height: number };
    }> = [];

    // Process each SVG file
    for (let i = 0; i < svg_files.length; i++) {
        const filename = svg_files[i];
        const filepath = path.join(opt.base_dir, `${filename}.svg`);
        const svgContent = readFileSync(filepath, "utf8");

        // Parse SVG content
        const svgInfo = parseSvgFile(svgContent, filename);
        if (svgInfo) {
            // Add unicode value (starting from e000)
            const unicodeChar = String.fromCodePoint(0xe000 + i);

            glyphs.push({
                path: svgInfo.path,
                name: filename,
                unicode: unicodeChar,
                width: svgInfo.viewBox.width,
                height: svgInfo.viewBox.height,
                viewBox: svgInfo.viewBox,
            });
        }
    }

    // Generate SVG font
    return generateSvgFont(glyphs);
}

/**
 * Parse an SVG file to extract path and viewBox information
 * @param svgContent SVG file content
 * @param name SVG name
 * @returns Object containing path and viewBox information
 */
function parseSvgFile(
    svgContent: string,
    name: string,
): { path: string; viewBox: { minX: number; minY: number; width: number; height: number } } | null {
    try {
        // Extract viewBox attribute
        const viewBoxMatch = svgContent.match(/viewBox=['"]([^'"]+)['"]/);
        const viewBoxStr = viewBoxMatch ? viewBoxMatch[1] : "0 0 1000 1000";
        const [minX, minY, width, height] = viewBoxStr.split(" ").map(Number);

        // Extract path data
        const pathMatch = svgContent.match(/<path[^>]*d=['"]([^'"]+)['"]/);
        if (!pathMatch) {
            console.error(`No path found in SVG file: ${name}`);
            return null;
        }

        const path = pathMatch[1];

        return {
            path,
            viewBox: { minX, minY, width, height },
        };
    } catch (error) {
        console.error(`Error parsing SVG file ${name}:`, error);
        return null;
    }
}

/**
 * Generate SVG font from glyph information
 * @param glyphs Array of glyph information
 * @returns SVG font as string
 */
function generateSvgFont(
    glyphs: Array<{
        path: string;
        name: string;
        unicode: string;
        width: number;
        height: number;
        viewBox: { minX: number; minY: number; width: number; height: number };
    }>,
): string {
    // Calculate font metrics
    const fontAscent = 800;
    const fontDescent = 200;
    const fontUnitsPerEm = 1000;

    // Create the SVG font XML
    const svgFont = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <font id="custom-font" horiz-adv-x="${fontUnitsPerEm}">
      <font-face 
        font-family="custom-font"
        units-per-em="${fontUnitsPerEm}"
        ascent="${fontAscent}"
        descent="${fontDescent}"
      />
      <missing-glyph horiz-adv-x="${fontUnitsPerEm}" />
      ${glyphs
          .map(
              (glyph) => `
      <glyph 
        glyph-name="${glyph.name}" 
        unicode="${glyph.unicode}" 
        horiz-adv-x="${glyph.width}" 
        d="${glyph.path}"
      />`,
          )
          .join("")}
    </font>
  </defs>
</svg>`;

    return svgFont;
}

/**
 * Generate CSS for the font
 * @param opt Options for CSS generation
 * @returns CSS string
 */
export function generateCss(opt: GenerateCssOptions): string {
    const { font_family, url, glyphs, unicode_base } = opt;

    let css = `@font-face {
    font-family: '${font_family}';
    font-style: normal;
    font-weight: 400;
    font-display: block;
    src: url("${url}") format("woff2");
}

.hf::before { content: var(--hf); }
`;

    // Add CSS for each glyph
    glyphs.forEach((glyph, index) => {
        const unicodePoint = unicode_base + index;
        css += `.hf-${glyph} { --hf: "\\${unicodePoint.toString(16)}"; }\n`;
    });

    return css;
}

/**
 * Convert SVG files to WOFF2 and generate CSS
 * @param svg_files Array of SVG file names without extension
 * @param opt Options for conversion
 * @returns Object containing WOFF2 buffer and CSS string
 */
export function svg2woff2(svg_files: string[], opt: Svg2Woff2Options): { woff2: Buffer; css: string } {
    const { base_dir, font_family, output_file } = opt;

    // Step 1: Convert SVG files to SVG font
    const svgFontString = svgFilesToSvgFont(svg_files, { base_dir });

    // Step 2: Convert SVG font to TTF
    const ttfBuffer = svg2ttf(svgFontString, {
        version: "1.0",
        description: "Font generated by svg2woff2",
        url: "https://github.com/osawa-naotaka/svg2woff2",
    }).buffer;

    // Step 3: Convert TTF to WOFF2
    const ttfBufferForWoff2 = Buffer.from(ttfBuffer);
    const woff2Buffer = ttf2woff2(ttfBufferForWoff2);

    // Step 4: Generate CSS
    const url = path.basename(output_file);
    const css = generateCss({
        font_family,
        url,
        glyphs: svg_files,
        unicode_base: 0xe000,
    });

    return {
        woff2: Buffer.from(woff2Buffer),
        css,
    };
}
