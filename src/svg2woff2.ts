const elementToPath = require("element-to-path");
import type { TransformObject } from "svg-path-commander";
import SVGPathCommander from "svg-path-commander";
import svg2ttf_lib from "@lulliecat/svg2ttf";
import type { INode } from "svgson";
import { parse as svgsonParse, stringify as svgsonStringify } from "svgson";
import ttf2woff2 from "ttf2woff2";

export interface Svg2Woff2Options {
    ttf_font_opt: TtfFontParameters;
    svg_font_opt: SvgFontParameters;
    unicode_base?: number;
}

export interface TtfFontParameters {
    version: string;
    description: string;
    url: string;
    ts: number;
}

export interface SvgFontParameters {
    font_family: string;
    units_per_em?: number;
    ascent?: number;
    descent?: number;
    offset_y?: number;
    height_decrese?: number;
    preserve_viewbox?: boolean;
}

export interface GenerateCssOptions {
    font_family: string;
    font_url: string;
    unicode_base?: number;
    vertical_align?: string;
}

export interface Svg {
    name: string;
    content: string;
}

type ParsedSve = {
    path: string;
    view_box?: ViewBox;
};

type Glyph = {
    name: string;
    unicode: string;
    svg: ParsedSve;
};

type ViewBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type NormalizedSvgPath = {
    path: string;
    width: number;
};

const default_unicode_base = 0xe000;

/**
 * Convert SVG strings to SVG font
 * @param svgs Array of SVG strings
 * @param opt SVG Font metadata
 * @returns SVG font as string
 */
export async function svgsToSvgFont(
    svgs: Svg[],
    opt: Required<SvgFontParameters>,
    unicode_base: number,
): Promise<string> {
    const glyphs: Glyph[] = [];

    for (let i = 0; i < svgs.length; i++) {
        const parsed_svg = await parseSvg(svgs[i].content, svgs[i].name);
        if (parsed_svg) {
            const unicodeChar = String.fromCodePoint(unicode_base + i);

            glyphs.push({
                name: svgs[i].name,
                unicode: unicodeChar,
                svg: parsed_svg,
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
function normalizeSvgPath(glyph: Glyph, opt: Required<SvgFontParameters>): NormalizedSvgPath {
    const fliped = new SVGPathCommander(glyph.svg.path).flipY();

    const size: ViewBox = opt.preserve_viewbox && glyph.svg.view_box ? glyph.svg.view_box : fliped.getBBox();
    const scale_y = (opt.units_per_em - opt.height_decrese) / size.height;
    const translate: Partial<TransformObject> = {
        translate: [-size.x, -size.y],
    };
    const scale: Partial<TransformObject> = {
        scale: [scale_y, scale_y],
    };
    const post_translate: Partial<TransformObject> = {
        translate: [0, opt.offset_y],
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
async function parseSvg(svgContent: string, name: string): Promise<ParsedSve | null> {
    try {
        const svgJson = await svgsonParse(svgContent);

        const paths: string[] = [];
        let view_box: ViewBox | null = null;

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
                } else if (node.name === "svg" && node.attributes.viewBox) {
                    const vb = node.attributes.viewBox.split(" ").map((v) => Number.parseInt(v, 10));
                    if (vb.length === 4) {
                        view_box = { x: vb[0], y: vb[1], width: vb[2], height: vb[3] };
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

        return view_box !== null ? { path: paths.join(" "), view_box } : { path: paths.join(" ") };
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
async function generateSvgFont(glyphs: Glyph[], opt: Required<SvgFontParameters>): Promise<string> {
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
        const transformed_path = normalizeSvgPath(glyph, opt);

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
    const { font_family, font_url, unicode_base, vertical_align } = opt;

    let css = `@font-face { font-family: '${font_family}'; font-style: normal; font-weight: 400; font-display: block; src: url("${font_url}") format("woff2"); }
@layer font { .hf { font-family: '${font_family}'; font-style: normal; font-weight: normal; ${vertical_align ? `vertical-align: ${vertical_align}; ` : ""}} }
@layer font { .hf::before { content: var(--hf); } }
`;

    // Add CSS for each glyph
    svgs.forEach((svg, index) => {
        const unicodePoint = (unicode_base || default_unicode_base) + index;
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
    // default values
    const units_per_em = opt.svg_font_opt.units_per_em || 1024;
    const required: Required<SvgFontParameters> = {
        font_family: opt.svg_font_opt.font_family,
        units_per_em,
        ascent: opt.svg_font_opt.ascent || units_per_em,
        descent: opt.svg_font_opt.descent || 0,
        offset_y: opt.svg_font_opt.offset_y || 0,
        height_decrese: opt.svg_font_opt.height_decrese || 0,
        preserve_viewbox: opt.svg_font_opt.preserve_viewbox || true,
    };

    const svgFontString = await svgsToSvgFont(svgs, required, opt.unicode_base || default_unicode_base);
    const ttfBuffer = svg2ttf_lib(svgFontString, opt.ttf_font_opt).buffer;

    return Buffer.from(ttfBuffer);
}
