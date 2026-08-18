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
 *
 * Returns { contours, edges }:
 * - contours: legacy structure grouped only on explicit MoveTo (used by
 *   inspect.mjs for display purposes). Each contour has a SINGLE fill0/fill1
 *   captured at MoveTo time — this is NOT reliable when a mid-contour
 *   StyleChangeRecord changes fill0/fill1 without a MoveTo (Scaleform does
 *   this). Do not use `contours` for fill rendering.
 * - edges: a flat list of individual edges (straight/curved), each carrying
 *   the fill0/fill1/line values that were active AT THE TIME the edge was
 *   read. This correctly captures mid-contour fill changes and is the
 *   correct input for path reconstruction in buildSvg (see
 *   `buildFillPathsFromEdges`).
 *
 * groupOnStyleChange: legacy flag kept for inspect.mjs compatibility
 * (affects only `contours`, not `edges`).
 */
export function parseShapeRecords(buf, pos, numFillBits, numLineBits, shapeVersion, { groupOnStyleChange = false } = {}) {
    let r = new BitReader(buf, pos * 8);
    let x = 0;
    let y = 0;
    let fill0 = 0;
    let fill1 = 0;
    let line = 0;
    const contours = []; // { fill0, fill1, line, segments } — legacy, display only
    const edges = []; // { type: 'L'|'Q', x0, y0, x1, y1, cx?, cy?, fill0, fill1, line }
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
                // Explicit MoveTo: always start a new contour (display only)
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
                const x0 = x, y0 = y;
                if (general === 0) {
                    const vert = r.readBits(1);
                    if (vert) y += r.readSignedBits(nBits);
                    else x += r.readSignedBits(nBits);
                } else {
                    x += r.readSignedBits(nBits);
                    y += r.readSignedBits(nBits);
                }
                if (current) current.segments.push(['L', x, y]);
                edges.push({ type: 'L', x0, y0, x1: x, y1: y, fill0, fill1, line });
            } else {
                const nBits = r.readBits(4) + 2;
                const x0 = x, y0 = y;
                const cx = x + r.readSignedBits(nBits);
                const cy = y + r.readSignedBits(nBits);
                const ax = cx + r.readSignedBits(nBits);
                const ay = cy + r.readSignedBits(nBits);
                if (current) current.segments.push(['Q', cx, cy, ax, ay]);
                edges.push({ type: 'Q', x0, y0, cx, cy, x1: ax, y1: ay, fill0, fill1, line });
                x = ax;
                y = ay;
            }
        }
    }
    return { contours, edges };
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

    const { contours, edges } = parseShapeRecords(buf, pos, numFillBits, numLineBits, version, options);
    return { bounds, fills: styles.fills, lines: styles.lines, contours, edges };
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

/**
 * Reverse a single edge so it goes from x1,y1 back to x0,y0.
 * For a curve, the control point stays the same — only the anchor
 * endpoints (x0,y0)/(x1,y1) swap.
 */
function reverseEdge(e) {
    if (e.type === 'Q') return { type: 'Q', x0: e.x1, y0: e.y1, cx: e.cx, cy: e.cy, x1: e.x0, y1: e.y0 };
    return { type: 'L', x0: e.x1, y0: e.y1, x1: e.x0, y1: e.y0 };
}

function pointKey(x, y) {
    return `${x},${y}`;
}

/**
 * Reconstruct closed SVG subpaths from an unordered bag of edges by
 * matching endpoints (JPEXS-style path reconstruction).
 *
 * SWF fill semantics: fill1 is the fill on the RIGHT of the edge direction,
 * fill0 is on the LEFT. For a given fill index, we collect:
 *   - every edge whose fill1 === index, as-is
 *   - every edge whose fill0 === index, reversed (so that index ends up on
 *     the right of the reversed edge, consistent with the fill1 edges)
 * Because Scaleform allows the active fill to change mid-contour (without
 * a MoveTo), edges belonging to the same fill index are not necessarily
 * contiguous in the original record stream — but they always form closed
 * loops geometrically (each edge endpoint is shared with exactly one other
 * edge of the same fill bag, apart from possible touching points). We
 * rebuild the loops by hashing edges on their start point and greedily
 * walking chains until we return to the loop's start point.
 */
function reconstructPaths(edgeBag) {
    // Map from "x0,y0" → queue of edge indices starting there (unused)
    const byStart = new Map();
    const used = new Array(edgeBag.length).fill(false);
    for (let i = 0; i < edgeBag.length; i++) {
        const key = pointKey(edgeBag[i].x0, edgeBag[i].y0);
        if (!byStart.has(key)) byStart.set(key, []);
        byStart.get(key).push(i);
    }

    const takeEdgeAt = (x, y) => {
        const key = pointKey(x, y);
        const queue = byStart.get(key);
        if (!queue) return -1;
        while (queue.length) {
            const idx = queue.shift();
            if (!used[idx]) return idx;
        }
        return -1;
    };

    const loops = []; // array of edge arrays (each a closed loop)
    for (let i = 0; i < edgeBag.length; i++) {
        if (used[i]) continue;
        const startEdge = edgeBag[i];
        used[i] = true;
        const loop = [startEdge];
        const startX = startEdge.x0;
        const startY = startEdge.y0;
        let curX = startEdge.x1;
        let curY = startEdge.y1;

        // Follow the chain until we return to the loop's start point,
        // or no continuation edge is found (open end — shouldn't normally
        // happen for well-formed closed shapes, but guard against it).
        let guard = edgeBag.length + 1;
        while (!(curX === startX && curY === startY) && guard-- > 0) {
            const nextIdx = takeEdgeAt(curX, curY);
            if (nextIdx < 0) break;
            used[nextIdx] = true;
            const e = edgeBag[nextIdx];
            loop.push(e);
            curX = e.x1;
            curY = e.y1;
        }
        loops.push(loop);
    }
    return loops;
}

function loopToD(loop, scale, ox, oy) {
    const px = (v) => (v * scale + ox).toFixed(2);
    const py = (v) => (v * scale + oy).toFixed(2);
    let d = `M${px(loop[0].x0)},${py(loop[0].y0)}`;
    for (const e of loop) {
        if (e.type === 'L') d += `L${px(e.x1)},${py(e.y1)}`;
        else d += `Q${px(e.cx)},${py(e.cy)} ${px(e.x1)},${py(e.y1)}`;
    }
    return d;
}

/**
 * Build per-fill-index path data ('d' strings) from the flat edge list,
 * using endpoint-matching reconstruction (see reconstructPaths above).
 * Returns Map<fillIndex, string> (the 'd' attribute for that fill).
 */
export function buildFillPathsFromEdges(edges, scale, ox, oy) {
    const bags = new Map(); // fillIndex → edge[]
    const addTo = (idx, edge) => {
        if (!bags.has(idx)) bags.set(idx, []);
        bags.get(idx).push(edge);
    };
    for (const e of edges) {
        if (e.fill1 > 0) addTo(e.fill1, e);
        if (e.fill0 > 0) addTo(e.fill0, reverseEdge(e));
    }

    const result = new Map();
    for (const [fillIndex, bag] of bags) {
        const loops = reconstructPaths(bag);
        const d = loops.map((loop) => loopToD(loop, scale, ox, oy)).join('');
        result.set(fillIndex, d);
    }
    return result;
}

/**
 * Build per-line-index path data using the same endpoint-matching
 * reconstruction (strokes don't need direction, but reconstruction still
 * yields minimal, correctly joined subpaths).
 */
export function buildLinePathsFromEdges(edges, scale, ox, oy) {
    const bags = new Map();
    for (const e of edges) {
        if (e.line > 0) {
            if (!bags.has(e.line)) bags.set(e.line, []);
            bags.get(e.line).push(e);
        }
    }
    const result = new Map();
    for (const [lineIndex, bag] of bags) {
        const loops = reconstructPaths(bag);
        const d = loops.map((loop) => loopToD(loop, scale, ox, oy)).join('');
        result.set(lineIndex, d);
    }
    return result;
}

export function buildSvg(parsed, scale = 1 / 20) {
    const { bounds, fills, lines, edges } = parsed;
    const width = ((bounds.xmax - bounds.xmin) * scale).toFixed(2);
    const height = ((bounds.ymax - bounds.ymin) * scale).toFixed(2);
    const ox = -bounds.xmin * scale;
    const oy = -bounds.ymin * scale;

    // JPEXS-style rendering: fill1 edges as-is + fill0 edges reversed,
    // reconstructed into closed loops by endpoint matching. This correctly
    // handles mid-contour fill changes (StyleChangeRecord without MoveTo).
    const fillPaths = buildFillPathsFromEdges(edges, scale, ox, oy);
    const linePaths = buildLinePathsFromEdges(edges, scale, ox, oy);

    const paths = [];
    for (const [fillIndex, d] of fillPaths) {
        const f = fills[fillIndex - 1];
        if (!f || !d) continue;
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
    for (const [lineIndex, d] of linePaths) {
        const l = lines[lineIndex - 1];
        if (!l || !d) continue;
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
