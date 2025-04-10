import { readFileSync } from "node:fs";

export function svg2woff2(
    svg_files: string[],
    options: { base_dir: string; font_family: string; output_file: string },
) {
    // SVGファイルを読み込む
    const svgData = svg_files.map((file) => {
        const filePath = `${options.base_dir}${file}.svg`;
        const data = readFileSync(filePath, "utf8"); // SVGファイルを読み込む
        // 例: const data = fs.readFileSync(filePath, 'utf8');
        return data; // 読み込んだSVGデータを返す
    });

    // WOFF2フォントを生成するロジックをここに追加
    const woff2 = generateWoff2(svgData); // 仮の関数

    // CSSを生成する
    const css = `
@font-face {
    font-family: '${options.font_family}';
    font-style: normal;
    font-weight: 400;
    font-display: block;
    src: url("../fonts/${options.output_file}") format("woff2");
} 
${svg_files.map((file, index) => `.hf-${file} { --hf: "\\e00${index}"; }`).join("\n")}
`;

    return { woff2, css };
}

// WOFF2生成のための仮の関数
function generateWoff2(svgData: string[]) {
    // WOFF2生成ロジックをここに実装
    // WOFF2生成のためのロジックをここに実装
    const woff2Data = Buffer.concat(
        svgData.map((svg) => {
            // SVGデータをWOFF2フォーマットに変換する処理をここに追加
            // 例: const convertedData = convertSvgToWoff2(svg);
            return Buffer.from(svg); // 仮の変換処理
        }),
    );
    return woff2Data; // 生成したWOFF2データを返す
}
