// Convert parsed SWF font glyph data (from fonts_swf.mjs) to TTF via opentype.js.
// This bypasses SVG font format entirely, producing browser-native font files.
// Usage: node scripts/gfx/fonts_swf_convert.mjs [fonts_dir]
//
// Input: directory with {fontName}.json + {fontName}.svg
// Output: {fontName}.ttf in the same directory.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import opentype from 'opentype.js';

const fontsDir = process.argv[2] ?? 'scripts/gfx/out/fonts_swf';

// Discover font subdirectories
const entries = readdirSync(fontsDir, { withFileTypes: true });
const fontDirs = entries
    .filter(e => e.isDirectory() && e.name !== 'Arial')
    .map(e => e.name)
    .sort();

for (const dir of fontDirs) {
    const jsonPath = join(fontsDir, dir, `${dir}.json`);
    if (!existsSync(jsonPath)) continue;

    try {
        const jsonData = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        const hasPaths = jsonData.glyphs.some(g => g.path && g.path.length > 0);
        if (!hasPaths) {
            console.log(`  Skip ${dir}: no valid glyph paths`);
            continue;
        }

        console.log(`  Converting: ${jsonData.fontName} (${dir})`);

        const ttfBuffer = convertFontToTTF(jsonData, dir);
        const ttfPath = join(fontsDir, dir, `${dir}.ttf`);
        writeFileSync(ttfPath, Buffer.from(ttfBuffer));
        console.log(`    → ${dir}.ttf (${Math.round(ttfBuffer.byteLength / 1024)} KB)`);

        // opentype.js doesn't support direct WOFF2 output, so we just generate TTF.
        // Browser WOFF2 can be generated via google/woff2 tool if needed.
    } catch (e) {
        console.log(`  Error ${dir}: ${e.message}`);
    }
}

function convertFontToTTF(jsonData, dir) {
    const { glyphs, fontName, layout, hasLayout, numGlyphs } = jsonData;

    // Use 1024 unitsPerEm to match reference TTF from Skyrim.
    // Path coordinates stay as-is from SVG font (they're in font units).
    const unitsPerEm = 1024;
    const pathScale = 1;

    // Calculate ascender/descender from SWF layout (twips → font units).
    // Reference TTF: ascender = layout.ascent / 20, descender = -(layout.descent / 20)
    let ascent, descent;
    if (hasLayout && layout && layout.ascent && layout.descent) {
        ascent = Math.round(layout.ascent / 20);
        descent = -Math.round(layout.descent / 20);
    } else {
        // Fallback: read from SVG font
        const svgPath = join(fontsDir, dir, `${dir}.svg`);
        if (existsSync(svgPath)) {
            const svgText = readFileSync(svgPath, 'utf-8');
            const svgUpem = parseInt(svgText.match(/units-per-em="([^"]+)"/)?.[1]) || 2048;
            const scale = unitsPerEm / svgUpem;
            ascent = Math.round(parseInt(svgText.match(/ascent="([^"]+)"/)?.[1]) || 1500 * scale);
            descent = Math.round(parseInt(svgText.match(/descent="([^"]+)"/)?.[1]) || -500 * scale);
        } else {
            ascent = 800;
            descent = -200;
        }
    }

    // opentype.js expects negative descender (below baseline)
    // SVG font has descent as negative, layout may have positive
    const otDescender = descent > 0 ? -descent : descent;
    const adjustedDescender = otDescender >= 0 ? -Math.max(otDescender, 300) : otDescender;

    // Build advance width map from SWF layout advances (twips → font units)
    // Reference TTF uses: advanceWidth = swfAdvance / 20
    // This holds for upem=1024 — the reference maps 1 twip = 1/20 font unit
    const advanceMap = new Map();
    const defaultAdv = Math.round(unitsPerEm * 0.6);
    if (hasLayout && layout && layout.advances) {
        for (let i = 0; i < layout.advances.length && i < glyphs.length; i++) {
            const codePoint = glyphs[i].code;
            if (codePoint) {
                advanceMap.set(codePoint, Math.round(layout.advances[i] / 20));
            }
        }
    } else {
        // Fallback: use font default
        advanceMap.set(0, defaultAdv);
    }

    const otGlyphs = [];
    const unicodeMap = {};

    let glyphIndex = 0;
    for (const g of glyphs) {
        const codePoint = g.code;
        const pathStr = g.path;

        if (!pathStr || pathStr.length === 0) {
            const notDef = new opentype.Glyph({
                name: codePoint ? `uni${codePoint.toString(16).toUpperCase().padStart(4, '0')}` : '.notdef',
                unicode: codePoint || undefined,
                advanceWidth: advanceMap.get(codePoint) || advanceMap.get(0) || Math.round(unitsPerEm * 0.5),
                path: new opentype.Path(),
            });
            otGlyphs.push(notDef);
            if (codePoint) unicodeMap[codePoint] = glyphIndex;
            glyphIndex++;
            continue;
        }

        const otPath = parseSvgPathToOpenType(pathStr, pathScale);

        const advanceWidth = advanceMap.get(codePoint) || advanceMap.get(0) || Math.round(unitsPerEm * 0.6);

        const otGlyph = new opentype.Glyph({
            name: codePoint ? `uni${codePoint.toString(16).toUpperCase().padStart(4, '0')}` : '.notdef',
            unicode: codePoint || undefined,
            advanceWidth,
            path: otPath,
        });

        otGlyphs.push(otGlyph);
        if (codePoint) unicodeMap[codePoint] = glyphIndex;
        glyphIndex++;
    }

    // Create the OpenType font
    const font = new opentype.Font({
        familyName: fontName,
        styleName: 'Regular',
        unitsPerEm,
        ascender: ascent,
        descender: adjustedDescender,
        glyphs: otGlyphs,
    });

    // Return as ArrayBuffer
    return font.toArrayBuffer();
}

/**
 * Parse an SVG path 'd' string into an opentype.Path.
 * Supports M, L, Q (quadratic bezier), Z commands.
 *
 * CRITICAL: SVG font format uses Y-flipped coordinates compared to OpenType.
 * In SVG font (after our fontToSvgFont Y-flip): negative Y = ABOVE baseline.
 * In OpenType: positive Y = ABOVE baseline.
 * So we must NEGATE all Y coordinates (and apply the scale factor).
 */
function parseSvgPathToOpenType(d, scale = 1) {
    const path = new opentype.Path();

    const tokens = d.match(/[MmLlQqZz][-.\d,\s]*/g) || [];
    let cx = 0, cy = 0; // current position (in OpenType coords)

    for (const token of tokens) {
        const cmd = token[0];
        const argsStr = token.slice(1).trim();
        const args = argsStr ? argsStr.split(/[\s,]+/).filter(s => s !== '').map(Number) : [];

        if (cmd === 'M' || cmd === 'm') {
            const isRel = cmd === 'm';
            for (let i = 0; i + 1 < args.length; i += 2) {
                const x = (isRel ? cx + args[i] : args[i]) * scale;
                // NEGATE Y: SVG font has negative Y = up, OpenType has positive Y = up
                const y = (isRel ? cy - args[i + 1] : -args[i + 1]) * scale;
                path.moveTo(x, y);
                cx = x;
                cy = y;
            }
        } else if (cmd === 'L' || cmd === 'l') {
            const isRel = cmd === 'l';
            for (let i = 0; i + 1 < args.length; i += 2) {
                const x = (isRel ? cx + args[i] : args[i]) * scale;
                const y = (isRel ? cy - args[i + 1] : -args[i + 1]) * scale;
                path.lineTo(x, y);
                cx = x;
                cy = y;
            }
        } else if (cmd === 'Q' || cmd === 'q') {
            const isRel = cmd === 'q';
            for (let i = 0; i + 3 < args.length; i += 4) {
                const cpx = (isRel ? cx + args[i] : args[i]) * scale;
                const cpy = (isRel ? cy - args[i + 1] : -args[i + 1]) * scale;
                const x = (isRel ? cx + args[i + 2] : args[i + 2]) * scale;
                const y = (isRel ? cy - args[i + 3] : -args[i + 3]) * scale;
                path.quadraticCurveTo(cpx, cpy, x, y);
                cx = x;
                cy = y;
            }
        } else if (cmd === 'Z' || cmd === 'z') {
            path.closePath();
        }
    }

    return path;
}

console.log(`Done. TTF files generated in ${fontsDir}`);