// Extract fonts from a SWF file (Skyrim fonts_ru.swf, fonts_en.swf, etc.).
// Usage: node scripts/gfx/fonts_swf.mjs [path/to/file.swf|.b64] [outdir]
// Accepts a binary SWF file (FWS/CWS/ZWS) or a base64-encoded SWF.
//
// Output for each font:
//   {fontName}.svg        — SVG font file (usable with @font-face)
//   {fontName}.json       — per-glyph SVG path + metadata (for programmatic use)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
    readU16LE, readU32LE, latin1ToString, BitReader,
    readRect, parseGlyphShape, glyphEdgesToPath,
    fontToSvgFont, parseHeader,
} from './lib.mjs';

// ---------- SWF-specific helpers ----------

/**
 * Decompress a CWS/ZWS SWF file (zlib-compressed body after the 8-byte header).
 */
async function decompressSwfBody(data) {
    const sig = String.fromCharCode(data[0], data[1], data[2]);
    if (sig === 'FWS') {
        // Uncompressed — header is 8 bytes (sig + ver + size), rest is body
        return data.subarray(8);
    }
    if (sig === 'CWS') {
        // Zlib compressed after the 8-byte header
        const compressed = data.subarray(8);
        if (typeof DecompressionStream !== 'undefined') {
            const ds = new DecompressionStream('deflate');
            const stream = new Blob([compressed]).stream().pipeThrough(ds);
            const buf = await new Response(stream).arrayBuffer();
            return new Uint8Array(buf);
        }
        throw new Error('DecompressionStream is unavailable (requires Node 18+ or a modern browser)');
    }
    if (sig === 'ZWS') {
        // LZMA compressed — not supported yet
        throw new Error('ZWS (LZMA) compressed SWF is not supported');
    }
    throw new Error(`Unknown SWF signature: ${sig}. Expected FWS, CWS, or ZWS`);
}

/**
 * Decode the input to raw SWF body.
 * Accepts: a binary SWF file (FWS/CWS), a base64 string of a SWF,
 * or a .b64 file (auto-detected).
 */
async function decodeSwfInput(input) {
    // If it's already a buffer, check if it starts with FWS/CWS/ZWS
    if (input instanceof Uint8Array || input instanceof ArrayBuffer || Buffer.isBuffer(input)) {
        const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
        const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
        if (sig === 'FWS' || sig === 'CWS' || sig === 'ZWS') {
            return await decompressSwfBody(bytes);
        }
        // Maybe it's base64 text in a buffer? Check first bytes for printable base64 chars
        if (bytes[0] > 0x7f) {
            throw new Error(`Unknown binary format: signature "${sig}"`);
        }
        // Treat as base64 text
        const text = new TextDecoder().decode(bytes).trim();
        const decoded = base64ToBytes(text);
        return await decompressSwfBody(decoded);
    }
    if (typeof input === 'string') {
        // Could be a base64 string (possibly with data: URL prefix)
        // or already a binary string. Try base64 decoding.
        const cleaned = input.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
        const decoded = base64ToBytes(cleaned);
        const sig = String.fromCharCode(decoded[0], decoded[1], decoded[2]);
        if (sig === 'FWS' || sig === 'CWS' || sig === 'ZWS') {
            return await decompressSwfBody(decoded);
        }
        // Try treating the whole input as binary text
        const bytes = new Uint8Array(input.length);
        for (let i = 0; i < input.length; i++) bytes[i] = input.charCodeAt(i) & 0xff;
        const sig2 = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
        if (sig2 === 'FWS' || sig2 === 'CWS' || sig2 === 'ZWS') {
            return await decompressSwfBody(bytes);
        }
        throw new Error('Cannot decode SWF from string input');
    }
    throw new Error('SWF: expected a base64 string, Uint8Array, ArrayBuffer, or Buffer');
}

function base64ToBytes(base64) {
    const clean = String(base64).replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(clean, 'base64'));
    }
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

// ---------- Font parsing with wideOffsets support ----------

/**
 * Parse all DefineFont tags (code 48=DefineFont2, 75=DefineFont3) from an
 * SWF body buffer (after decompression — body starts at the RECT, NOT
 * including the 8-byte FWS header).
 *
 * This is an enhanced SWF font parser that correctly handles the
 * `wideOffsets` flag (UI32 offset entries when set).
 *
 * Returns an array of font objects:
 * {
 *   fontId, fontName, fontFlags, language, numGlyphs,
 *   glyphs: [{ index, code, svgPath, edges, segments }],
 *   layout?, hasLayout,
 * }
 */
export function parseSwfFonts(swfBody) {
    // Use parseHeader from lib.mjs — it reads Rect from bit 0,
    // which is correct for the SWF body (after stripping the FWS header).
    const header = parseHeader(swfBody);
    const fonts = [];
    let pos = header.pos;

    while (pos + 2 <= swfBody.length) {
        const codeAndLen = readU16LE(swfBody, pos);
        const code = codeAndLen >> 6;
        let len = codeAndLen & 0x3f;
        let headerSize = 2;
        if (len === 0x3f) {
            len = readU32LE(swfBody, pos + 2);
            headerSize = 6;
        }
        if (code === 0) break;

        // DefineFont2 = 48, DefineFont3 = 75
        if (code === 48 || code === 75) {
            const font = parseSingleFont(swfBody, pos, headerSize, len, code);
            if (font) fonts.push(font);
        }

        pos += headerSize + len;
    }

    return fonts;
}

function parseSingleFont(swf, pos, headerSize, tagLen, code) {
    const start = pos + headerSize;
    let p = start + 2; // skip fontId (UI16)
    if (p + 2 > swf.length) return null;

    const fontFlags = swf[p++];
    const language = swf[p++];

    const wideOffsets = (fontFlags & 0x80) !== 0;
    const hasLayout = (fontFlags & 0x08) !== 0;

    // Font name: null-terminated for Latin (language=0), length-prefixed otherwise
    let fontName;
    if (language !== 0) {
        if (p >= swf.length) return null;
        const nameLen = swf[p++];
        if (p + nameLen > swf.length) return null;
        fontName = latin1ToString(swf, p, p + nameLen).replace(/\x00/g, '').trim();
        p += nameLen;
    } else {
        let nameEnd = p;
        while (nameEnd < swf.length && swf[nameEnd] !== 0) nameEnd++;
        if (nameEnd >= swf.length) return null;
        fontName = latin1ToString(swf, p, nameEnd).trim();
        p = nameEnd + 1;
    }

    if (p + 2 > swf.length) return null;
    const numGlyphs = readU16LE(swf, p);
    p += 2;

    // Offset table: UI16 or UI32 depending on wideOffsets flag.
    // Important: wideOffsets ONLY affects the offset size when hasLayout=true.
    // When hasLayout=false, offsets are always UI16 (the SWF spec says
    // the flag shifts between UI16/UI32, but in practice Skyrim's SWF
    // files set wideOffsets=true even on hasLayout=false fonts and
    // the offsets remain UI16).
    const offsetTableStart = p;
    const offsets = [];
    const useWideOffsets = wideOffsets && hasLayout;

    if (useWideOffsets) {
        for (let i = 0; i <= numGlyphs; i++) {
            if (p + 4 > swf.length) break;
            offsets.push(readU32LE(swf, p));
            p += 4;
        }
    } else {
        for (let i = 0; i <= numGlyphs; i++) {
            if (p + 2 > swf.length) break;
            offsets.push(readU16LE(swf, p));
            p += 2;
        }
    }

    if (offsets.length <= numGlyphs) return null;

    const codeTablePos = offsetTableStart + offsets[numGlyphs];

    // Parse glyphs
    const glyphs = [];
    for (let gi = 0; gi < numGlyphs; gi++) {
        const gStart = offsetTableStart + offsets[gi];
        const gEnd = offsetTableStart + offsets[gi + 1];
        if (gStart >= swf.length || gEnd > swf.length) {
            glyphs.push({ index: gi, code: 0, edges: [], segments: [], svgPath: '' });
            continue;
        }
        const codePoint = readU16LE(swf, codeTablePos + gi * 2);
        const gData = swf.slice(gStart, gEnd);

        try {
            if (gData.length < 1) {
                glyphs.push({ index: gi, code: codePoint, edges: [], segments: [], svgPath: '' });
                continue;
            }
            const { edges, segments } = parseGlyphShape(gData);
            const svgPath = glyphEdgesToPath(edges);
            glyphs.push({
                index: gi,
                code: codePoint,
                edges,
                segments,
                svgPath,
            });
        } catch {
            glyphs.push({
                index: gi,
                code: codePoint,
                edges: [],
                segments: [],
                svgPath: '',
            });
        }
    }

    // Layout info (if hasLayout)
    let layout = null;
    if (hasLayout) {
        try {
            let lp = codeTablePos + numGlyphs * 2;
            if (lp + 6 > swf.length) return null;
            const ascent = readU16LE(swf, lp);
            const descent = readU16LE(swf, lp + 2);
            const leading = readU16LE(swf, lp + 4);
            lp += 6;

            const advances = [];
            for (let i = 0; i < numGlyphs; i++) {
                if (lp + 2 > swf.length) break;
                advances.push(readU16LE(swf, lp));
                lp += 2;
            }

            // Bounds table (RECT per glyph)
            const bounds = [];
            for (let i = 0; i < numGlyphs; i++) {
                if (lp >= swf.length) break;
                const br = new BitReader(swf, lp * 8);
                const rect = readRect(br);
                br.alignByte();
                lp = br.bytePos;
                bounds.push(rect);
            }

            // Kerning
            const kerning = [];
            if (lp + 2 <= swf.length) {
                const kernCount = readU16LE(swf, lp);
                lp += 2;
                for (let i = 0; i < kernCount && lp + 6 <= swf.length; i++) {
                    const k1 = readU16LE(swf, lp);
                    const k2 = readU16LE(swf, lp + 2);
                    const adj = readU16LE(swf, lp + 4);
                    kerning.push({ k1, k2, adjustment: adj });
                    lp += 6;
                }
            }

            layout = { ascent, descent, leading, advances, bounds, kerning };
        } catch {
            layout = null;
        }
    }

    return {
        fontId: readU16LE(swf, start),
        code,
        fontName,
        fontFlags,
        language,
        hasLayout,
        wideOffsets,
        numGlyphs,
        glyphs,
        layout,
        dataStart: start,
        tagLen: pos + headerSize + tagLen - start,
    };
}

// ---------- Main ----------

const file = process.argv[2] ?? 'public/fonts_ru.swf';
const outdir = process.argv[3] ?? 'scripts/gfx/out/fonts_swf';

console.log(`Reading: ${file}`);

const fileData = readFileSync(file);

// Detect if it's a base64 file (.b64) or binary (.swf)
let swfBody;
const sig = String.fromCharCode(fileData[0], fileData[1], fileData[2]);
if (sig === 'FWS' || sig === 'CWS' || sig === 'ZWS') {
    swfBody = await decompressSwfBody(fileData);
} else {
    // Treat as base64 text
    const text = fileData.toString('utf8').trim();
    const decoded = base64ToBytes(text);
    swfBody = await decompressSwfBody(decoded);
}

console.log(`SWF decompressed: ${swfBody.length} bytes (body, after header)\n`);

const fonts = parseSwfFonts(swfBody);

mkdirSync(outdir, { recursive: true });

console.log(`Found ${fonts.length} font(s)\n`);

for (const font of fonts) {
    const safeName = font.fontName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dir = join(outdir, safeName);
    mkdirSync(dir, { recursive: true });

    // 1. SVG font file
    const svgFont = fontToSvgFont(font, 2048);
    writeFileSync(join(dir, `${safeName}.svg`), svgFont);
    console.log(`  SVG font: ${safeName}.svg (${Math.round(svgFont.length / 1024)} KB)`);

    // 2. Per-glyph JSON
    const glyphData = [];
    for (const g of font.glyphs) {
        glyphData.push({
            index: g.index,
            char: g.code >= 32 && g.code <= 126 ? String.fromCharCode(g.code) : null,
            code: g.code,
            codeHex: `U+${g.code.toString(16).toUpperCase().padStart(4, '0')}`,
            path: g.svgPath,
            edgeCount: g.edges.length,
        });
    }

    const jsonData = {
        fontName: font.fontName,
        fontId: font.fontId,
        numGlyphs: font.numGlyphs,
        hasLayout: font.hasLayout,
        wideOffsets: font.wideOffsets,
        layout: font.layout,
        glyphs: glyphData,
    };

    writeFileSync(join(dir, `${safeName}.json`), JSON.stringify(jsonData, null, 2));
    console.log(`  Glyph data: ${safeName}.json`);

    const valid = font.glyphs.filter(g => g.svgPath && g.svgPath.length > 0).length;
    console.log(`    ${font.fontName}: ${font.numGlyphs} glyphs (${valid} valid)`);

    // Print char coverage
    const printableCodes = font.glyphs.filter(g => g.code >= 32).map(g => g.code);
    if (printableCodes.length > 0) {
        const minCode = Math.min(...printableCodes);
        const maxCode = Math.max(...printableCodes);
        const printable = font.glyphs.filter(g => g.code >= 32 && g.code <= 126).length;
        console.log(`    Codes: ${minCode}..${maxCode}, printable ASCII: ${printable}`);
    }

    // Show first few char codes
    const sampleCodes = font.glyphs.slice(0, 15).filter(g => g.code >= 32).map(g => {
        const ch = g.code <= 0xffff ? String.fromCodePoint(g.code) : '?';
        return `U+${g.code.toString(16).toUpperCase().padStart(4, '0')} (${ch})`;
    });
    if (sampleCodes.length > 0) {
        console.log(`    Samples: ${sampleCodes.join(', ')}`);
    }
}

console.log(`\nDone. Output in ${outdir}`);