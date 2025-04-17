import elementToPath from "element-to-path";
import SVGPathCommander from "svg-path-commander";
import type { TransformObject } from "svg-path-commander";
import svg2ttf_lib from "svg2ttf";
import { parse as svgsonParse, stringify as svgsonStringify } from "svgson";
import type { INode } from "svgson";
import ttf2woff2 from "ttf2woff2";

export interface Svg2Woff2Options {
    ttf_font_opt: TtfFontParameters;
    svg_font_opt: SvgFontParameters;
}

export interface TtfFontParameters {
    version: string;
    description: string;
    url: string;
}

export interface SvgFontParameters {
    font_family: string;
    ascent: number;
    descent: number;
    units_per_em: number;
    offset_y: number;
    height_decrese: number;
}

export interface GenerateCssOptions {
    font_family: string;
    font_url: string;
    unicode_base?: number;
}

export interface Svg {
    name: string;
    content: string;
}

/**
 * Convert SVG strings to SVG font
 * @param svgs Array of SVG strings
 * @param opt SVG Font metadata
 * @returns SVG font as string
 */
export async function svgsToSvgFont(svgs: Svg[], opt: SvgFontParameters): Promise<string> {
    const glyphs: Array<{
        path: string;
        name: string;
        unicode: string;
    }> = [];

    for (let i = 0; i < svgs.length; i++) {
        const svgPath = await parseSvg(svgs[i].content, svgs[i].name);
        if (svgPath) {
            const unicodeChar = String.fromCodePoint(0xe000 + i);

            glyphs.push({
                path: svgPath,
                name: svgs[i].name,
                unicode: unicodeChar,
            });
        }
    }

    return generateSvgFont(glyphs, opt);
}

/**
 * Normalize SVG path for correct font orientation and size using SVGPathCommander
 * @param path Original SVG path
 * @param height SVG path hight to scale
 * @returns Normalized path and its width
 */
type NormalizedSvgPath = {
    path: string;
    width: number;
};

function normalizeSvgPath(path: string, height: number, offset_y: number, height_decrese: number): NormalizedSvgPath {
    const fliped = new SVGPathCommander(path).flipY();
    const size = fliped.getBBox();
    const scale_y = (height - height_decrese) / size.height;
    const translate: Partial<TransformObject> = {
        translate: [-size.x, -size.y],
    };
    const scale: Partial<TransformObject> = {
        scale: [scale_y, scale_y],
    };
    const post_translate: Partial<TransformObject> = {
        translate: [0, offset_y],
    };

    const processed = fliped.transform(translate).transform(scale).transform(post_translate);
    const processed_size = processed.getBBox();

    return {
        path: processed.toString(),
        width: processed_size.width,
    };
}

/**
 * Parse an SVG string to extract path using svgson
 * @param svgContent SVG content
 * @param name SVG name
 * @returns path string
 */
async function parseSvg(svgContent: string, name: string): Promise<string | null> {
    try {
        const svgJson = await svgsonParse(svgContent);

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

        return paths.join(" ");
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
 * @param opt SVG Font metadata
 * @returns SVG font as string
 */
async function generateSvgFont(
    glyphs: Array<{
        path: string;
        name: string;
        unicode: string;
    }>,
    opt: SvgFontParameters,
): Promise<string> {
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
                {},
                element("font-face", {
                    "font-family": opt.font_family,
                    "units-per-em": opt.units_per_em.toString(),
                    ascent: opt.ascent.toString(),
                    descent: opt.descent.toString(),
                }),
                element("missing-glyph", {
                    "horiz-adv-x": opt.units_per_em.toString(),
                    "vert-adv-y": opt.units_per_em.toString(),
                }),
            ),
        ),
    );

    const fontElement = svgFontJson.children[0].children[0];

    for (const glyph of glyphs) {
        const transformed_path = normalizeSvgPath(glyph.path, opt.units_per_em, opt.offset_y, opt.height_decrese);

        const glyphElement = element("glyph", {
            "glyph-name": glyph.name,
            unicode: glyph.unicode,
            "horiz-adv-x": transformed_path.width.toString(),
            "vert-adv-y": opt.units_per_em.toString(),
            d: transformed_path.path,
        });

        fontElement.children.push(glyphElement);
    }

    const svgString = svgsonStringify(svgFontJson);

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
export function generateCss(svgs: Svg[], opt: GenerateCssOptions): string {
    const { font_family, font_url, unicode_base } = opt;

    let css = `@font-face { font-family: '${font_family}'; font-style: normal; font-weight: 400; font-display: block; src: url("${font_url}") format("woff2"); }
@layer font { .hf { font-family: '${font_family}'; font-style: normal; font-weight: normal; vertical-align: -.125em; } }
@layer font { .hf::before { content: var(--hf); } }
`;

    // Add CSS for each glyph
    svgs.forEach((svg, index) => {
        const unicodePoint = (unicode_base || 0xe000) + index;
        css += `@layer font { .hf-${svg.name} { --hf: "\\${unicodePoint.toString(16)}"; } }\n`;
    });

    return css;
}

/**
 * Convert SVG strings to WOFF2
 * @param svgs Array of SVG strings
 * @param opt Options for conversion
 * @returns Object containing WOFF2 buffer
 */
export async function svg2woff2(svgs: Svg[], opt: Svg2Woff2Options): Promise<Buffer> {
    const ttfBuffer = await svg2ttf(svgs, opt);

    // Step 3: Convert TTF to WOFF2
    const woff2Buffer = ttf2woff2(ttfBuffer);

    return woff2Buffer;
}

/**
 * Convert SVG strings to TTF
 * @param svgs Array of SVG strings
 * @param opt Options for conversion
 * @returns Object containing TTF buffer
 */
export async function svg2ttf(svgs: Svg[], opt: Svg2Woff2Options): Promise<Buffer> {
    // Step 1: Convert SVG strings to SVG font
    const svgFontString = await svgsToSvgFont(svgs, opt.svg_font_opt);

    // Step 2: Convert SVG font to TTF
    const ttfBuffer = svg2ttf_lib(svgFontString, opt.ttf_font_opt).buffer;

    return Buffer.from(ttfBuffer);
}
