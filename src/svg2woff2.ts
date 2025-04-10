import { readFileSync } from "node:fs";
import path from "node:path";
import SVGPathCommander from "svg-path-commander";
import svg2ttf from "svg2ttf";
import { parse as svgsonParse, stringify as svgsonStringify } from "svgson";
import type { INode } from "svgson";
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
export async function svgFilesToSvgFont(svg_files: string[], opt: { base_dir: string }): Promise<string> {
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
        const svgInfo = await parseSvgFile(svgContent, filename);
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
 * Transform SVG path for correct font orientation using svg-path-commander
 * @param path Original SVG path
 * @returns Transformed path
 */
function transformSvgPath(path: string): string {
    try {
        return new SVGPathCommander(path).flipY().toString();
    } catch (error) {
        console.error("Error transforming SVG path:", error);
        return path;
    }
}

/**
 * Parse an SVG file to extract path and viewBox information using svgson
 * @param svgContent SVG file content
 * @param name SVG name
 * @returns Object containing path and viewBox information
 */
async function parseSvgFile(
    svgContent: string,
    name: string,
): Promise<{ path: string; viewBox: { minX: number; minY: number; width: number; height: number } } | null> {
    try {
        // Parse SVG to JSON using svgson
        const svgJson = await svgsonParse(svgContent);

        // Extract viewBox
        const viewBoxStr = svgJson.attributes.viewBox || "0 0 1000 1000";
        const [minX, minY, width, height] = viewBoxStr.split(" ").map(Number);

        // Find all path elements
        const paths: string[] = [];

        // Recursive function to find all path elements
        function findPaths(node: INode) {
            if (node.name === "path" && node.attributes.d) {
                paths.push(node.attributes.d);
            }

            if (node.children && node.children.length > 0) {
                node.children.forEach(findPaths);
            }
        }

        // Start searching from root
        findPaths(svgJson);

        if (paths.length === 0) {
            console.warn(`No path elements found in SVG file: ${name}`);
            return null;
        }

        // Combine all paths
        const combinedPath = paths.join(" ");

        return {
            path: combinedPath,
            viewBox: { minX, minY, width, height },
        };
    } catch (error) {
        console.error(`Error parsing SVG file ${name}:`, error);
        return null;
    }
}

/**
 * Generate SVG font using svgson for JSON manipulation and transformation
 * @param glyphs Array of glyph information
 * @returns SVG font as string
 */
async function generateSvgFont(
    glyphs: Array<{
        path: string;
        name: string;
        unicode: string;
        width: number;
        height: number;
        viewBox: { minX: number; minY: number; width: number; height: number };
    }>,
): Promise<string> {
    // Calculate font metrics
    const fontAscent = 800;
    const fontDescent = 200;
    const fontUnitsPerEm = 1000;

    // Create SVG font structure as JSON
    const svgFontJson = element(
        "svg",
        {
            xmlns: "http://www.w3.org/2000/svg",
            version: "1.1",
        },
        element(
            "defs",
            {},
            element(
                "font",
                { id: "custom-font", "horiz-adv-x": fontUnitsPerEm.toString() },
                element("font-face", {
                    "font-family": "custom-font",
                    "units-per-em": fontUnitsPerEm.toString(),
                    ascent: fontAscent.toString(),
                    descent: fontDescent.toString(),
                }),
                element("missing-glyph", { "horiz-adv-x": fontUnitsPerEm.toString() }),
            ),
        ),
    );

    // Font element reference for easier access
    const fontElement = svgFontJson.children[0].children[0];

    // Add each glyph to the font
    for (const glyph of glyphs) {
        try {
            // Transform path for correct font orientation using svg-path-commander
            const transformedPath = transformSvgPath(glyph.path);

            // Create glyph element
            const glyphElement = element("glyph", {
                "glyph-name": glyph.name,
                unicode: glyph.unicode,
                "horiz-adv-x": glyph.width.toString(),
                d: transformedPath,
            });

            // Add glyph to font
            fontElement.children.push(glyphElement);
        } catch (error) {
            console.error(`Error processing glyph ${glyph.name}:`, error);

            // Add glyph with original path as fallback
            const fallbackGlyphElement = element("glyph", {
                "glyph-name": glyph.name,
                unicode: glyph.unicode,
                "horiz-adv-x": glyph.width.toString(),
                d: glyph.path,
            });

            fontElement.children.push(fallbackGlyphElement);
        }
    }

    // Convert JSON back to SVG string
    const svgString = svgsonStringify(svgFontJson);

    // Add XML declaration and DOCTYPE
    const xmlDeclaration = '<?xml version="1.0" standalone="no"?>\n';
    const doctype =
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';

    return xmlDeclaration + doctype + svgString;
}

function element(e_name: string, attributes: Record<string, string>, ...children: INode[]): INode {
    return {
        name: e_name,
        type: "element",
        value: "",
        attributes,
        children,
    };
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
export async function svg2woff2(svg_files: string[], opt: Svg2Woff2Options): Promise<{ woff2: Buffer; css: string }> {
    const { base_dir, font_family, output_file } = opt;

    // Step 1: Convert SVG files to SVG font
    const svgFontString = await svgFilesToSvgFont(svg_files, { base_dir });

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
