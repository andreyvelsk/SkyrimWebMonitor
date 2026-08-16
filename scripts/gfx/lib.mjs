// Shared library for working with Scaleform GFX (Skyrim HUD).
// This is a wrapper around the "read → decompress → parse" pipeline:
// the input can be a base64 string, a Uint8Array/ArrayBuffer/Buffer
// (raw GFX file bytes), or a file path read via readFileSync.
//
// Works in both Node.js and the browser (decompression via DecompressionStream,
// Node 18+/modern browsers). There are no Node-specific imports in this module.
//
// Main functions:
//   parseGfx(input)          — { gfx, swf, header, exports, shapes }
//   parseShapes(input)       — [{ shapeId, code, parsed, svg | error }]
//   generateSvg(input)       — { [shapeId]: svg-string }
//   extractNames(swf)        — Map<shapeId, Map<spriteId, name>>
//
// Example:
//   import { parseGfx, generateSvg } from './lib.mjs';
//   const { header, exports, shapes } = await parseGfx('Q0ZY...'); // base64
//   const svgMap = await generateSvg(someBuffer);                 // Buffer/Uint8Array

// ---------- Input: base64 / buffer ----------

/**
 * Decode base64 (including data: URLs) into a Uint8Array.
 * Works identically in Node and the browser.
 */
export function base64ToBytes(base64) {
    const clean = String(base64).replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(clean, 'base64'));
    }
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

/**
 * Normalize the input to raw GFX bytes.
 * Accepts: a base64 string, Uint8Array, ArrayBuffer, Buffer.
 */
export function decodeGfxInput(input) {
    if (typeof input === 'string') return base64ToBytes(input);
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    throw new Error('GFX: expected a base64 string, Uint8Array, ArrayBuffer, or Buffer');
}

/**
 * Normalize file contents read via readFileSync (Buffer).
 * If it is a binary GFX file (signature "CFX"), return the bytes as-is;
 * otherwise treat the contents as base64 text and decode it.
 */
export function decodeGfxFileContent(data) {
    const isBinary = data.length >= 3 && data[0] === 0x43 && data[1] === 0x46 && data[2] === 0x58;
    if (isBinary) return decodeGfxInput(data);
    return decodeGfxInput(latin1ToString(data, 0, data.length));
}

/**
 * Decompress a GFX buffer to the SWF body.
 * GFX wrapper: "CFX" (3) + version (1) + size (4, LE) + zlib stream (0x78...).
 */
export async function inflateGfx(gfx) {
    const payload = gfx.subarray(8);
    const start = payload.indexOf(0x78);
    if (start < 0) throw new Error('GFX: zlib stream (0x78) not found');
    const compressed = payload.subarray(start);

    if (typeof DecompressionStream !== 'undefined') {
        const ds = new DecompressionStream('deflate');
        const stream = new Blob([compressed]).stream().pipeThrough(ds);
        const buf = await new Response(stream).arrayBuffer();
        return new Uint8Array(buf);
    }
    throw new Error('GFX: DecompressionStream is unavailable (requires Node 18+ or a modern browser)');
}

// ---------- Bit reading ----------

export class BitReader {
    constructor(buf, bitOffset = 0) {
        this.buf = buf;
        this.bitPos = bitOffset;
    }
    readBits(n) {
        let v = 0;
        for (let i = 0; i < n; i++) {
            const byte = this.buf[this.bitPos >> 3];
            const bit = (byte >> (7 - (this.bitPos & 7))) & 1;
            v = (v << 1) | bit;
            this.bitPos++;
        }
        return v >>> 0;
    }
    readSignedBits(n) {
        const v = this.readBits(n);
        if (n > 0 && (v & (1 << (n - 1)))) return v - (1 << n);
        return v;
    }
    alignByte() {
        this.bitPos = Math.ceil(this.bitPos / 8) * 8;
    }
    get bytePos() {
        return this.bitPos >> 3;
    }
}

export function readU16LE(buf, offset) {
    if (offset < 0 || offset + 2 > buf.length) {
        throw new RangeError(`The value of "offset" is out of range (offset=${offset}, length=${buf.length})`);
    }
    return buf[offset] | (buf[offset + 1] << 8);
}

export function readU32LE(buf, offset) {
    if (offset < 0 || offset + 4 > buf.length) {
        throw new RangeError(`The value of "offset" is out of range (offset=${offset}, length=${buf.length})`);
    }
    return (buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24)) >>> 0;
}

export function latin1ToString(bytes, start, end) {
    let s = '';
    for (let i = start; i < end; i++) s += String.fromCharCode(bytes[i]);
    return s;
}

export function readRect(reader) {
    const nbits = reader.readBits(5);
    return {
        nbits,
        xmin: reader.readSignedBits(nbits),
        xmax: reader.readSignedBits(nbits),
        ymin: reader.readSignedBits(nbits),
        ymax: reader.readSignedBits(nbits),
    };
}

function readRGB(buf, pos) {
    return [buf[pos], buf[pos + 1], buf[pos + 2]];
}

function readRGBA(buf, pos) {
    return [buf[pos], buf[pos + 1], buf[pos + 2], buf[pos + 3]];
}

function skipMatrix(buf, pos) {
    const r = new BitReader(buf, pos * 8);
    const hasScale = r.readBits(1);
    const nScaleBits = r.readBits(5);
    if (hasScale) {
        r.readSignedBits(nScaleBits);
        r.readSignedBits(nScaleBits);
    }
    const hasRotate = r.readBits(1);
    const nRotateBits = r.readBits(5);
    if (hasRotate) {
        r.readSignedBits(nRotateBits);
        r.readSignedBits(nRotateBits);
    }
    const nTranslateBits = r.readBits(5);
    r.readSignedBits(nTranslateBits);
    r.readSignedBits(nTranslateBits);
    r.alignByte();
    return r.bytePos;
}

export function parseStyles(buf, pos, shapeVersion) {
    let fillCount = buf[pos++];
    if (fillCount === 0xff) {
        fillCount = readU16LE(buf, pos);
        pos += 2;
    }
    const fills = [];
    for (let i = 0; i < fillCount; i++) {
        const type = buf[pos++];
        if (type === 0x00) {
            const color = shapeVersion >= 3 ? readRGBA(buf, pos) : [...readRGB(buf, pos), 255];
            pos += shapeVersion >= 3 ? 4 : 3;
            fills.push({ type: 'solid', color });
        } else if (type === 0x10 || type === 0x12 || type === 0x13) {
            // Scaleform GFx gradients always have a MATRIX
            pos = skipMatrix(buf, pos);
            const packed = buf[pos++];
            const numGrads = packed & 0x0f;
            const records = [];
            for (let g = 0; g < numGrads; g++) {
                const ratio = buf[pos++];
                const color = shapeVersion >= 3 ? readRGBA(buf, pos) : [...readRGB(buf, pos), 255];
                pos += shapeVersion >= 3 ? 4 : 3;
                records.push({ ratio, color });
            }
            if (type === 0x13) pos += 2;
            fills.push({ type: type === 0x10 ? 'linear' : type === 0x12 ? 'radial' : 'focal', records });
        } else if (type >= 0x40 && type <= 0x43) {
            // bitmap fill
            pos += 2; // bitmapId
            pos = skipMatrix(buf, pos);
            fills.push({ type: 'bitmap' });
        } else {
            // Unknown type — stop reading fill styles
            break;
        }
    }

    let lineCount = buf[pos++];
    if (lineCount === 0xff) {
        lineCount = readU16LE(buf, pos);
        pos += 2;
    }
    const lines = [];
    for (let i = 0; i < lineCount; i++) {
        const width = readU16LE(buf, pos);
        pos += 2;
        if (shapeVersion >= 4) {
            // LineStyle2: flags (UI16) after width
            pos += 2;
        }
        const color = shapeVersion >= 3 ? readRGBA(buf, pos) : [...readRGB(buf, pos), 255];
        pos += shapeVersion >= 3 ? 4 : 3;
        lines.push({ width, color });
    }
    return { pos, fills, lines };
}

/**
 * Parse shape records.
 * groupOnStyleChange: true — a new contour on every style change/MoveTo
 * (inspect.mjs behavior), false — only on MoveTo (generate.mjs behavior).
 */
export function parseShapeRecords(buf, pos, numFillBits, numLineBits, shapeVersion, { groupOnStyleChange = false } = {}) {
    let r = new BitReader(buf, pos * 8);
    let x = 0;
    let y = 0;
    let fill0 = 0;
    let fill1 = 0;
    let line = 0;
    const contours = []; // { fill0, fill1, line, segments }
    let current = null;

    const beginContour = (moveX, moveY) => {
        current = { fill0, fill1, line, segments: [['M', moveX ?? x, moveY ?? y]] };
        contours.push(current);
    };

    while (true) {
        const typeFlag = r.readBits(1);
        if (typeFlag === 0) {
            const sNew = r.readBits(1);
            const sLine = r.readBits(1);
            const sF1 = r.readBits(1);
            const sF0 = r.readBits(1);
            const sMove = r.readBits(1);
            if (!sNew && !sLine && !sF1 && !sF0 && !sMove) break;

            if (sMove) {
                const moveBits = r.readBits(5);
                x = r.readSignedBits(moveBits);
                y = r.readSignedBits(moveBits);
            }
            if (sF0) fill0 = r.readBits(numFillBits);
            if (sF1) fill1 = r.readBits(numFillBits);
            if (sLine) line = r.readBits(numLineBits);

            if (groupOnStyleChange) {
                if (sMove || sF0 || sF1 || sLine || sNew) beginContour(x, y);
            } else if (sMove) {
                beginContour(x, y);
            }

            if (sNew) {
                r.alignByte();
                const styles = parseStyles(buf, r.bytePos, shapeVersion);
                let bytePos = styles.pos;
                numFillBits = buf[bytePos] >> 4;
                numLineBits = buf[bytePos] & 0x0f;
                bytePos += 1;
                r = new BitReader(buf, bytePos * 8);
            }
        } else {
            const straightFlag = r.readBits(1);
            if (straightFlag === 1) {
                const nBits = r.readBits(4) + 2;
                const general = r.readBits(1);
                if (general === 0) {
                    const vert = r.readBits(1);
                    if (vert) y += r.readSignedBits(nBits);
                    else x += r.readSignedBits(nBits);
                } else {
                    x += r.readSignedBits(nBits);
                    y += r.readSignedBits(nBits);
                }
                if (current) current.segments.push(['L', x, y]);
            } else {
                const nBits = r.readBits(4) + 2;
                const cx = x + r.readSignedBits(nBits);
                const cy = y + r.readSignedBits(nBits);
                const ax = cx + r.readSignedBits(nBits);
                const ay = cy + r.readSignedBits(nBits);
                if (current) current.segments.push(['Q', cx, cy, ax, ay]);
                x = ax;
                y = ay;
            }
        }
    }
    return contours;
}

export const SHAPE_VERSION = { 2: 1, 22: 2, 32: 3, 83: 4 };

export function parseDefineShape(buf, pos, code, options) {
    pos += 2; // shapeId
    const br = new BitReader(buf, pos * 8);
    const bounds = readRect(br);
    br.alignByte();
    pos = br.bytePos;

    const version = SHAPE_VERSION[code] ?? 3;
    if (version >= 4) {
        // DefineShape4: EdgeBounds RECT + flags
        const eb = new BitReader(buf, pos * 8);
        readRect(eb);
        eb.alignByte();
        pos = eb.bytePos + 1; // + flags byte
    }

    const styles = parseStyles(buf, pos, version);
    pos = styles.pos;

    const numFillBits = buf[pos] >> 4;
    const numLineBits = buf[pos] & 0x0f;
    pos += 1;

    const contours = parseShapeRecords(buf, pos, numFillBits, numLineBits, version, options);
    return { bounds, fills: styles.fills, lines: styles.lines, contours };
}

// ---------- SVG ----------

export function colorToCss([r, g, b, a = 255]) {
    if (a === 255) return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
    return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
}

export function segmentsToD(segments, scale, ox, oy) {
    let d = '';
    for (const seg of segments) {
        const [kind, ...args] = seg;
        if (kind === 'M') d += `M${(args[0] * scale + ox).toFixed(2)},${(args[1] * scale + oy).toFixed(2)}`;
        else if (kind === 'L') d += `L${(args[0] * scale + ox).toFixed(2)},${(args[1] * scale + oy).toFixed(2)}`;
        else if (kind === 'Q') d += `Q${(args[0] * scale + ox).toFixed(2)},${(args[1] * scale + oy).toFixed(2)} ${(args[2] * scale + ox).toFixed(2)},${(args[3] * scale + oy).toFixed(2)}`;
    }
    return d;
}

export function buildSvg(parsed, scale = 1 / 20) {
    const { bounds, fills, lines, contours } = parsed;
    const width = ((bounds.xmax - bounds.xmin) * scale).toFixed(2);
    const height = ((bounds.ymax - bounds.ymin) * scale).toFixed(2);
    const ox = -bounds.xmin * scale;
    const oy = -bounds.ymin * scale;

    // Group contours by fill index (like JPEXS)
    const fillGroups = new Map(); // key: fillIndex → { fillIndex, d }
    const lineGroups = new Map(); // key: lineIndex → { lineIndex, d }

    for (const c of contours) {
        if (!c.segments.length) continue;
        const d = segmentsToD(c.segments, scale, ox, oy);

        if (c.fill0 > 0) {
            const key = c.fill0;
            if (!fillGroups.has(key)) fillGroups.set(key, { fillIndex: key, d: '' });
            fillGroups.get(key).d += d;
        }
        if (c.fill1 > 0) {
            const key = c.fill1;
            if (!fillGroups.has(key)) fillGroups.set(key, { fillIndex: key, d: '' });
            fillGroups.get(key).d += d;
        }
        if (c.line > 0) {
            const key = c.line;
            if (!lineGroups.has(key)) lineGroups.set(key, { lineIndex: key, d: '' });
            lineGroups.get(key).d += d;
        }
    }

    const paths = [];
    for (const { fillIndex, d } of fillGroups.values()) {
        const f = fills[fillIndex - 1];
        if (!f) continue;
        let fillAttr = 'fill="none"';
        if (f.type === 'solid' && f.color) {
            fillAttr = `fill="${colorToCss(f.color)}"`;
        } else if (f.records && f.records.length) {
            // For gradients, take the middle color (the record with ratio ≈ 128)
            const mid = f.records.reduce((a, b) => (Math.abs(a.ratio - 128) <= Math.abs(b.ratio - 128) ? a : b));
            fillAttr = `fill="${colorToCss(mid.color)}"`;
        }
        paths.push(`    <path d="${d}" ${fillAttr} fill-rule="evenodd" stroke="none"/>`);
    }
    for (const { lineIndex, d } of lineGroups.values()) {
        const l = lines[lineIndex - 1];
        if (!l) continue;
        paths.push(`    <path d="${d}" fill="none" stroke="${colorToCss(l.color)}" stroke-width="${(l.width * scale).toFixed(2)}"/>`);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}px" height="${height}px" viewBox="0 0 ${width} ${height}">
${paths.join('\n')}
</svg>`;
}

// ---------- High-level parsing ----------

/**
 * Parse the SWF header (after decompression).
 * Returns frameSize, frameRate, frameCount and the offset of the first tag.
 */
export function parseHeader(swf) {
    const hr = new BitReader(swf);
    const frameSize = readRect(hr);
    hr.alignByte();
    const frameRate = readU16LE(swf, hr.bytePos) / 256;
    const frameCount = readU16LE(swf, hr.bytePos + 2);
    return { frameSize, frameRate, frameCount, pos: hr.bytePos + 4 };
}

/**
 * Parse SWF tags starting at offset pos.
 * Returns { exports: Map<id, name>, shapes: [{ tagIndex, code, shapeId, dataStart, len }] }.
 */
export function parseTags(swf, pos) {
    const exports = new Map(); // characterId → name
    const shapes = []; // DescribeShape tags
    let tagIndex = 0;

    while (pos + 2 <= swf.length) {
        const codeAndLen = readU16LE(swf, pos);
        const code = codeAndLen >> 6;
        let len = codeAndLen & 0x3f;
        let headerSize = 2;
        if (len === 0x3f) {
            len = readU32LE(swf, pos + 2);
            headerSize = 6;
        }
        if (code === 0) break;

        if (code === 56) {
            // ExportAssets
            let p = pos + headerSize;
            const count = readU16LE(swf, p);
            p += 2;
            for (let i = 0; i < count; i++) {
                const id = readU16LE(swf, p);
                p += 2;
                let end = p;
                while (swf[end] !== 0) end++;
                exports.set(id, latin1ToString(swf, p, end).trim());
                p = end + 1;
            }
        }

        if ([2, 22, 32, 83].includes(code)) {
            shapes.push({
                tagIndex,
                code,
                shapeId: readU16LE(swf, pos + headerSize),
                dataStart: pos + headerSize,
                len,
                headerSize,
            });
        }

        pos += headerSize + len;
        tagIndex++;
    }
    return { exports, shapes };
}

/**
 * Parse an already decompressed SWF buffer.
 */
export function parseSwf(swf) {
    const header = parseHeader(swf);
    const { exports, shapes } = parseTags(swf, header.pos);
    return { header, exports, shapes };
}

/**
 * Main wrapper: accept base64/buffer/file and return everything parsed.
 * Returns { gfx, swf, header, exports, shapes }.
 */
export async function parseGfx(input) {
    const gfx = decodeGfxInput(input);
    const swf = await inflateGfx(gfx);
    return { gfx, swf, ...parseSwf(swf) };
}

/**
 * Parse all DefineShape tags and generate SVG.
 * Returns an array of [{ shapeId, code, parsed, svg }] or
 * [{ shapeId, code, error }] for failed shapes.
 */
export async function parseShapes(input, { groupOnStyleChange = false } = {}) {
    const { swf, shapes } = await parseGfx(input);
    const results = [];
    for (const s of shapes) {
        try {
            const parsed = parseDefineShape(swf, s.dataStart, s.code, { groupOnStyleChange });
            const svg = buildSvg(parsed);
            results.push({ shapeId: s.shapeId, code: s.code, parsed, svg });
        } catch (e) {
            results.push({ shapeId: s.shapeId, code: s.code, error: e.message });
        }
    }
    return results;
}

/**
 * Generate SVG for all shapes: { [shapeId]: svg-string }.
 */
export async function generateSvg(input, { groupOnStyleChange = false } = {}) {
    const results = await parseShapes(input, { groupOnStyleChange });
    const out = {};
    for (const r of results) {
        if (r.svg) out[r.shapeId] = r.svg;
    }
    return out;
}

/**
 * Extract the shapeId → Map<spriteId, name> mapping from an SWF buffer.
 * Analogous to extractNames from names.mjs, but works on an already
 * decompressed SWF buffer.
 */
export function extractNames(swf) {
    const exports = new Map(); // characterId → name
    const sprites = new Map(); // spriteId → Set<characterId>

    let pos = parseHeader(swf).pos;

    while (pos + 2 <= swf.length) {
        const codeAndLen = readU16LE(swf, pos);
        const code = codeAndLen >> 6;
        let len = codeAndLen & 0x3f;
        let headerSize = 2;
        if (len === 0x3f) {
            len = readU32LE(swf, pos + 2);
            headerSize = 6;
        }
        if (code === 0) break;

        if (code === 56) {
            // ExportAssets
            let p = pos + headerSize;
            const count = readU16LE(swf, p);
            p += 2;
            for (let i = 0; i < count; i++) {
                const id = readU16LE(swf, p);
                p += 2;
                let end = p;
                while (swf[end] !== 0) end++;
                exports.set(id, latin1ToString(swf, p, end).trim());
                p = end + 1;
            }
        }

        if (code === 39) {
            // DefineSprite
            const spriteId = readU16LE(swf, pos + headerSize);
            const refs = new Set();
            let sp = pos + headerSize + 2; // +2 = spriteId (UI16)
            const frameCount = readU16LE(swf, sp);
            sp += 2;

            const spriteEnd = pos + headerSize + len;
            while (sp + 2 <= spriteEnd) {
                const sc = readU16LE(swf, sp);
                const scode = sc >> 6;
                let slen = sc & 0x3f;
                let shs = 2;
                if (slen === 0x3f) {
                    slen = readU32LE(swf, sp + 2);
                    shs = 6;
                }
                if (scode === 0) break;

                // PlaceObject2 (26) or PlaceObject3 (70)
                if (scode === 26 || scode === 70) {
                    const flags = swf[sp + shs];
                    const hasCharacter = (flags & 0x02) !== 0;
                    if (hasCharacter) {
                        // Depth (UI16) + CharacterId (UI16)
                        const cid = readU16LE(swf, sp + shs + 1 + 2);
                        refs.add(cid);
                    }
                }
                sp += shs + slen;
            }
            sprites.set(spriteId, refs);
        }

        pos += headerSize + len;
    }

    // Build direct links: shapeId → spriteId
    const shapeToSprite = new Map();
    for (const [spriteId, refs] of sprites) {
        for (const refId of refs) {
            if (!shapeToSprite.has(refId)) shapeToSprite.set(refId, new Set());
            shapeToSprite.get(refId).add(spriteId);
        }
    }

    // Transitive name resolution
    const shapeNames = new Map();
    for (const [shapeId, spriteSet] of shapeToSprite) {
        const names = new Map(); // spriteId → name
        for (const spriteId of spriteSet) {
            let name = exports.get(spriteId);
            if (!name) {
                const parentSprites = shapeToSprite.get(spriteId);
                if (parentSprites) {
                    for (const parentId of parentSprites) {
                        const parentName = exports.get(parentId);
                        if (parentName) {
                            name = parentName;
                            break;
                        }
                    }
                }
            }
            if (name) {
                const existing = names.get(spriteId);
                if (!existing || (existing.includes('Undiscovered') && !name.includes('Undiscovered'))) {
                    names.set(spriteId, name);
                }
            }
        }
        if (names.size > 0) shapeNames.set(shapeId, names);
    }
    return shapeNames;
}
