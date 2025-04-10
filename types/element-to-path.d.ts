declare module "element-to-path" {
    import type { INode } from "svgson";

    /**
     * Converts SVG elements to path data
     *
     * @param element - An SVG element in svgson format (rect, circle, ellipse, line, polygon, polyline)
     * @returns Path data string or null if conversion is not possible
     */
    function elementToPath(element: INode): string | null;

    export default elementToPath;
}
