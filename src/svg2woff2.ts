import elementToPath from "element-to-path";
import SVGPathCommander from "svg-path-commander";
import svg2ttf from "svg2ttf";
import { parse as svgsonParse, stringify as svgsonStringify } from "svgson";
import type { INode } from "svgson";
import ttf2woff2 from "ttf2woff2";

export interface Svg2Woff2Options {
    font_family: string;
    output_file: string;
    version: string;
    description: string;
    url: string;
}

interface GenerateCssOptions {
    font_family: string;
    url: string;
    glyphs: Svg[];
    unicode_base: number;
}

export interface Svg {
    name: string;
    content: string;
}

/**
 * Convert SVG strings to SVG font
 * @param svgs Array of SVG strings
 * @param opt Options including base directory
 * @returns SVG font as string
 */
export async function svgsToSvgFont(svgs: Svg[]): Promise<string> {
    const glyphs: Array<{
        path: string;
        name: string;
        unicode: string;
        width: number;
        height: number;
        viewBox: { minX: number; minY: number; width: number; height: number };
    }> = [];

    // Process each SVG strings
    for (let i = 0; i < svgs.length; i++) {
        // Parse SVG content
        const svgInfo = await parseSvg(svgs[i].content, svgs[i].name);
        if (svgInfo) {
            // Add unicode value (starting from e000)
            const unicodeChar = String.fromCodePoint(0xe000 + i);

            glyphs.push({
                path: svgInfo.path,
                name: svgs[i].name,
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
 * Transform SVG path for correct font orientation using SVGPathCommander
 * @param path Original SVG path
 * @returns Transformed path
 */
function transformSvgPath(path: string): string {
    try {
        // Use SVGPathCommander to flip the path vertically
        return new SVGPathCommander(path).flipY().toString();
    } catch (error) {
        console.error("Error transforming SVG path:", error);
        // Return original path if transformation fails
        return path;
    }
}

/**
 * Parse an SVG string to extract path and viewBox information using svgson
 * @param svgContent SVG content
 * @param name SVG name
 * @returns Object containing path and viewBox information
 */
async function parseSvg(
    svgContent: string,
    name: string,
): Promise<{ path: string; viewBox: { minX: number; minY: number; width: number; height: number } } | null> {
    try {
        // Parse SVG to JSON using svgson
        const svgJson = await svgsonParse(svgContent);

        // Extract viewBox
        const viewBoxStr = svgJson.attributes.viewBox || "0 0 1000 1000";
        const [minX, minY, width, height] = viewBoxStr.split(" ").map(Number);

        // Process all SVG elements to paths
        const paths: string[] = [];

        // Recursive function to process all elements
        function processElements(node: INode) {
            try {
                // If it's a path element, add its data directly
                if (node.name === "path" && node.attributes.d) {
                    paths.push(node.attributes.d);
                }
                // If it's another SVG shape element, convert it to a path
                else if (["rect", "circle", "ellipse", "line", "polygon", "polyline"].includes(node.name)) {
                    const pathData = elementToPath(node);
                    if (pathData) {
                        paths.push(pathData);
                    }
                }

                // Process children
                if (node.children && node.children.length > 0) {
                    node.children.forEach(processElements);
                }
            } catch (error) {
                console.error(`Error processing element ${node.name} in SVG ${name}:`, error);
            }
        }

        // Start processing from root
        processElements(svgJson);

        if (paths.length === 0) {
            console.warn(`No convertible elements found in SVG: ${name}`);
            return null;
        }

        // Combine all paths
        const combinedPath = paths.join(" ");

        return {
            path: combinedPath,
            viewBox: { minX, minY, width, height },
        };
    } catch (error) {
        console.error(`Error parsing SVG ${name}:`, error);
        return null;
    }
}

/**
 * Helper function to create an element node
 * @param e_name Element name
 * @param attributes Element attributes
 * @param children Child elements
 * @returns INode object
 */
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
            // Transform path for correct font orientation
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
        css += `.hf-${glyph.name} { --hf: "\\${unicodePoint.toString(16)}"; }\n`;
    });

    return css;
}

/**
 * Convert SVG strings to WOFF2 and generate CSS
 * @param svgs Array of SVG strings
 * @param opt Options for conversion
 * @returns Object containing WOFF2 buffer and CSS string
 */
export async function svg2woff2(svgs: Svg[], opt: Svg2Woff2Options): Promise<{ woff2: Buffer; css: string }> {
    const { version, description, url, font_family, output_file } = opt;

    // Step 1: Convert SVG strings to SVG font
    const svgFontString = await svgsToSvgFont(svgs);

    // Step 2: Convert SVG font to TTF
    const ttfBuffer = svg2ttf(svgFontString, { version, description, url }).buffer;

    // Step 3: Convert TTF to WOFF2
    const ttfBufferForWoff2 = Buffer.from(ttfBuffer);
    const woff2Buffer = ttf2woff2(ttfBufferForWoff2);

    // Step 4: Generate CSS
    const css = generateCss({
        font_family,
        url: output_file,
        glyphs: svgs,
        unicode_base: 0xe000,
    });

    return {
        woff2: Buffer.from(woff2Buffer),
        css,
    };
}
