/**
 * Browser TypeScript port of the SWF font parser from
 * scripts/gfx/fonts_swf.mjs and scripts/gfx/lib.mjs.
 *
 * Parses DefineFont2 (tag code 48) and DefineFont3 (tag code 75) tags
 * from decompressed SWF bodies, reconstructs glyph outlines as SVG paths.
 */

import type {
  FontLayout,
  GfxFont,
  GfxGlyph,
  GfxGlyphEdge,
} from './types';

// ---------------------------------------------------------------------------
// BitReader
// ---------------------------------------------------------------------------

class BitReader {
  buf: Uint8Array;
  bitPos: number;

  constructor(buf: Uint8Array, bitOffset = 0) {
    this.buf = buf;
    this.bitPos = bitOffset;
  }

  readBits(n: number): number {
    let v = 0;
    for (let i = 0; i < n; i++) {
      const byte = this.buf[this.bitPos >> 3];
      const bit = (byte >> (7 - (this.bitPos & 7))) & 1;
      v = (v << 1) | bit;
      this.bitPos++;
    }
    return v >>> 0;
  }

  readSignedBits(n: number): number {
    const v = this.readBits(n);
    if (n > 0 && (v & (1 << (n - 1)))) return v - (1 << n);
    return v;
  }

  alignByte(): void {
    this.bitPos = Math.ceil(this.bitPos / 8) * 8;
  }

  get bytePos(): number {
    return this.bitPos >> 3;
  }
}

// ---------------------------------------------------------------------------
// Binary helpers
// ---------------------------------------------------------------------------

function readU16LE(buf: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 2 > buf.length) {
    throw new RangeError(
      `readU16LE offset out of range (offset=${offset}, length=${buf.length})`,
    );
  }
  return buf[offset] | (buf[offset + 1] << 8);
}

function readU32LE(buf: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 4 > buf.length) {
    throw new RangeError(
      `readU32LE offset out of range (offset=${offset}, length=${buf.length})`,
    );
  }
  return (
    (buf[offset] |
      (buf[offset + 1] << 8) |
      (buf[offset + 2] << 16) |
      (buf[offset + 3] << 24)) >>>
    0
  );
}

function latin1ToString(bytes: Uint8Array, start: number, end: number): string {
  let s = '';
  for (let i = start; i < end; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

interface SwfRect {
  nbits: number;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

function readRect(reader: BitReader): SwfRect {
  const nbits = reader.readBits(5);
  return {
    nbits,
    xmin: reader.readSignedBits(nbits),
    xmax: reader.readSignedBits(nbits),
    ymin: reader.readSignedBits(nbits),
    ymax: reader.readSignedBits(nbits),
  };
}

// ---------------------------------------------------------------------------
// Base64 decoding (browser: atob)
// ---------------------------------------------------------------------------

function base64ToBytes(base64: string): Uint8Array {
  const clean = String(base64)
    .replace(/^data:[^,]*,/, '')
    .replace(/\s+/g, '');
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ---------------------------------------------------------------------------
// Zlib decompression (browser DecompressionStream with node:zlib fallback)
// ---------------------------------------------------------------------------

/**
 * Decompress the SWF body.
 *
 * - FWS: body is stored as-is (simply skip the 8-byte header).
 * - CWS: body is zlib-compressed after the 8-byte header.
 */
export async function decompressSwfBody(data: Uint8Array): Promise<Uint8Array> {
  const sig = String.fromCharCode(data[0], data[1], data[2]);

  if (sig === 'FWS') {
    // Uncompressed — header is 8 bytes (sig+ver+size), rest is body
    return data.subarray(8);
  }

  if (sig === 'CWS') {
    const compressed = data.subarray(8);
    // Prefer native DecompressionStream (available in modern browsers and
    // Node 18+ when --experimental-global-webstreams or similar is active).
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate');
      const blob = new Blob([new Uint8Array(compressed)]);
      const stream = blob.stream().pipeThrough(ds);
      const buf = await new Response(stream).arrayBuffer();
      return new Uint8Array(buf);
    }
    // Fallback: try dynamic import of node:zlib
    try {
       
      const zlib = await import('node:zlib');
      return new Promise<Uint8Array>((resolve, reject) => {
        zlib.inflate(compressed, (err: Error | null, result: Buffer) => {
          if (err) reject(err);
          else resolve(new Uint8Array(result));
        });
      });
    } catch {
      throw new Error(
        'decompressSwfBody: DecompressionStream unavailable and node:zlib fallback failed',
      );
    }
  }

  if (sig === 'ZWS') {
    throw new Error('ZWS (LZMA) compressed SWF is not supported');
  }

  throw new Error(`Unknown SWF signature: ${sig}. Expected FWS, CWS, or ZWS`);
}

// ---------------------------------------------------------------------------
// Input normalisation
// ---------------------------------------------------------------------------

/**
 * Normalise an SWF input (base64 string, Uint8Array, or ArrayBuffer) into a
 * decompressed SWF body (ready for tag iteration).
 */
export async function decodeSwfInput(
  input: string | Uint8Array | ArrayBuffer,
): Promise<Uint8Array> {
  // Uint8Array or ArrayBuffer
  if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    const bytes =
      input instanceof Uint8Array ? input : new Uint8Array(input);
    const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
    if (sig === 'FWS' || sig === 'CWS' || sig === 'ZWS') {
      return decompressSwfBody(bytes);
    }
    // Could be base64 text in a buffer
    if (bytes[0] > 0x7f) {
      throw new Error(`Unknown binary format: signature "${sig}"`);
    }
    const text = new TextDecoder().decode(bytes).trim();
    const decoded = base64ToBytes(text);
    return decompressSwfBody(decoded);
  }

  // String: base64 (possibly with data: URL prefix)
  if (typeof input === 'string') {
    const cleaned = input
      .replace(/^data:[^,]*,/, '')
      .replace(/\s+/g, '');
    const decoded = base64ToBytes(cleaned);
    const sig = String.fromCharCode(decoded[0], decoded[1], decoded[2]);
    if (sig === 'FWS' || sig === 'CWS' || sig === 'ZWS') {
      return decompressSwfBody(decoded);
    }
    // Treat whole string as binary text
    const bytes = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) bytes[i] = input.charCodeAt(i) & 0xff;
    const sig2 = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
    if (sig2 === 'FWS' || sig2 === 'CWS' || sig2 === 'ZWS') {
      return decompressSwfBody(bytes);
    }
    throw new Error('Cannot decode SWF from string input');
  }

  throw new Error('SWF: expected a base64 string, Uint8Array, or ArrayBuffer');
}

// ---------------------------------------------------------------------------
// SWF header parsing
// ---------------------------------------------------------------------------

interface SwfHeader {
  frameSize: SwfRect;
  frameRate: number;
  frameCount: number;
  pos: number;
}

function parseHeader(swf: Uint8Array): SwfHeader {
  const hr = new BitReader(swf);
  const frameSize = readRect(hr);
  hr.alignByte();
  const frameRate = readU16LE(swf, hr.bytePos) / 256;
  const frameCount = readU16LE(swf, hr.bytePos + 2);
  return { frameSize, frameRate, frameCount, pos: hr.bytePos + 4 };
}

// ---------------------------------------------------------------------------
// Glyph shape parsing
// ---------------------------------------------------------------------------

/**
 * Parse a single glyph shape from a DefineFont2/3 glyph record.
 *
 * Glyph shapes are SWF ShapeWithoutStyle: 1 byte numFillBits|numLineBits
 * followed by shape records (only edges — no fill/line style definitions).
 *
 * Returns { edges, segments } where each edge/segment uses SWF twip coordinates.
 */
export function parseGlyphShape(data: Uint8Array): {
  edges: GfxGlyphEdge[];
  segments: unknown[];
} {
  const numFillBits = data[0] >> 4;
  const numLineBits = data[0] & 0x0f;

  const r = new BitReader(data, 8); // skip the nibble byte
  let x = 0;
  let y = 0;
  let fill0 = 0;
  let fill1 = 0;
  let line = 0;
  const segments: unknown[] = [];
  const edges: GfxGlyphEdge[] = [];

   
  while (true) {
    const typeFlag = r.readBits(1);
    if (typeFlag === 0) {
      // Style change record
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
        segments.push(['M', x, y]);
      }
      if (sF0) fill0 = r.readBits(numFillBits);
      if (sF1) fill1 = r.readBits(numFillBits);
      if (sLine) line = r.readBits(numLineBits);
      if (sNew) break; // no sub-shapes in glyph records
    } else {
      // Edge record
      const straightFlag = r.readBits(1);
      const x0 = x;
      const y0 = y;

      if (straightFlag === 1) {
        // Straight edge
        const nBits = r.readBits(4) + 2;
        const general = r.readBits(1);
        if (general === 0) {
          const vert = r.readBits(1);
          if (vert) {
            y += r.readSignedBits(nBits);
          } else {
            x += r.readSignedBits(nBits);
          }
        } else {
          x += r.readSignedBits(nBits);
          y += r.readSignedBits(nBits);
        }
        segments.push(['L', x, y]);
        edges.push({
          type: 'L',
          x0,
          y0,
          x1: x,
          y1: y,
          fill0,
          fill1,
          line,
        });
      } else {
        // Curved edge (quadratic bezier)
        const nBits = r.readBits(4) + 2;
        const cx = x + r.readSignedBits(nBits);
        const cy = y + r.readSignedBits(nBits);
        const ax = cx + r.readSignedBits(nBits);
        const ay = cy + r.readSignedBits(nBits);
        segments.push(['Q', cx, cy, ax, ay]);
        edges.push({
          type: 'Q',
          x0,
          y0,
          cx,
          cy,
          x1: ax,
          y1: ay,
          fill0,
          fill1,
          line,
        });
        x = ax;
        y = ay;
      }
    }
  }

  return { edges, segments };
}

// ---------------------------------------------------------------------------
// Edge bagging and path reconstruction
// ---------------------------------------------------------------------------

/**
 * Reverse a single edge so it goes from x1,y1 back to x0,y0.
 * For a curve, the control point stays the same — only the anchor
 * endpoints (x0,y0)/(x1,y1) swap.
 */
function reverseEdge(e: GfxGlyphEdge): GfxGlyphEdge {
  if (e.type === 'Q') {
    const cx = e.cx;
    const cy = e.cy;
    if (cx === undefined || cy === undefined) {
      // Fallback: treat malformed curve edge as straight line
      return {
        type: 'L',
        x0: e.x1,
        y0: e.y1,
        x1: e.x0,
        y1: e.y0,
        fill0: e.fill0,
        fill1: e.fill1,
        line: e.line,
      };
    }
    return {
      type: 'Q',
      x0: e.x1,
      y0: e.y1,
      cx,
      cy,
      x1: e.x0,
      y1: e.y0,
      fill0: e.fill0,
      fill1: e.fill1,
      line: e.line,
    };
  }
  return {
    type: 'L',
    x0: e.x1,
    y0: e.y1,
    x1: e.x0,
    y1: e.y0,
    fill0: e.fill0,
    fill1: e.fill1,
    line: e.line,
  };
}

function pointKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Reconstruct closed SVG subpaths from an unordered bag of edges by
 * matching endpoints (JPEXS-style path reconstruction).
 *
 * For a given fill index, we collect:
 *   - every edge whose fill1 === index, as-is
 *   - every edge whose fill0 === index, reversed (so that index ends up on
 *     the right of the reversed edge, consistent with the fill1 edges)
 *
 * Returns an array of loops, where each loop is an array of edges forming
 * a closed chain.
 */
function reconstructPaths(edgeBag: GfxGlyphEdge[]): GfxGlyphEdge[][] {
  // Map from "x0,y0" → queue of edge indices starting there (unused)
  const byStart = new Map<string, number[]>();
  const used = new Array(edgeBag.length).fill(false);
  for (let i = 0; i < edgeBag.length; i++) {
    const key = pointKey(edgeBag[i].x0, edgeBag[i].y0);
    const queue = byStart.get(key);
    if (queue) {
      queue.push(i);
    } else {
      byStart.set(key, [i]);
    }
  }

  const takeEdgeAt = (x: number, y: number): number => {
    const key = pointKey(x, y);
    const queue = byStart.get(key);
    if (!queue) return -1;
    while (queue.length) {
      const idx = queue.shift();
      if (idx !== undefined && !used[idx]) return idx;
    }
    return -1;
  };

  const loops: GfxGlyphEdge[][] = [];
  for (let i = 0; i < edgeBag.length; i++) {
    if (used[i]) continue;
    const startEdge = edgeBag[i];
    used[i] = true;
    const loop = [startEdge];
    const startX = startEdge.x0;
    const startY = startEdge.y0;
    let curX = startEdge.x1;
    let curY = startEdge.y1;

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

function loopToD(
  loop: GfxGlyphEdge[],
  scale: number,
  ox: number,
  oy: number,
): string {
  const px = (v: number) => (v * scale + ox).toFixed(2);
  const py = (v: number) => (v * scale + oy).toFixed(2);
  let d = `M${px(loop[0].x0)},${py(loop[0].y0)}`;
  for (const e of loop) {
    if (e.type === 'L') {
      d += `L${px(e.x1)},${py(e.y1)}`;
    } else {
      const cx = e.cx;
      const cy = e.cy;
      if (cx === undefined || cy === undefined) continue;
      d += `Q${px(cx)},${py(cy)} ${px(e.x1)},${py(e.y1)}`;
    }
  }
  return d;
}

// ---------------------------------------------------------------------------
// Public: glyphEdgesToPath
// ---------------------------------------------------------------------------

/**
 * Convert a glyph's edge list to an SVG path 'd' string.
 *
 * Glyph shapes use fill=1 (which has no style in SWF — it means "fill with
 * the font color"), so we collect all edges that have fill0>0 or fill1>0
 * into a single bag and reconstruct closed loops via endpoint matching.
 *
 * @param edges  Array of edge objects from parseGlyphShape
 * @param scale  Scale factor (default 1/20 to convert twips to px)
 * @param ox     X offset
 * @param oy     Y offset
 * @returns SVG path 'd' string
 */
export function glyphEdgesToPath(
  edges: GfxGlyphEdge[],
  scale = 1 / 20,
  ox = 0,
  oy = 0,
): string {
  // Bag all edges that have any fill (fill0 or fill1 > 0)
  const bag: GfxGlyphEdge[] = [];
  for (const e of edges) {
    if (e.fill1 > 0) bag.push(e);
    if (e.fill0 > 0) bag.push(reverseEdge(e));
  }

  if (bag.length === 0) return '';

  const loops = reconstructPaths(bag);
  return loops.map((loop) => loopToD(loop, scale, ox, oy)).join('');
}

// ---------------------------------------------------------------------------
// Font parsing (DefineFont2 / DefineFont3)
// ---------------------------------------------------------------------------

/**
 * Parse a single DefineFont2/DefineFont3 tag into a GfxFont object.
 *
 * @param swf        Decompressed SWF body
 * @param pos        Absolute position of the tag record header in `swf`
 * @param headerSize Size of the tag record header (2 or 6 bytes)
 * @param tagLen     Total tag data length (excluding header)
 * @param code       Tag type (48 = DefineFont2, 75 = DefineFont3)
 * @returns          Parsed font, or null on truncation
 */
function parseSingleFont(
  swf: Uint8Array,
  pos: number,
  headerSize: number,
  tagLen: number,
  code: number,
): GfxFont | null {
  const start = pos + headerSize;
  let p = start + 2; // skip fontId (UI16)
  if (p + 2 > swf.length) return null;

  const fontFlags = swf[p++];
  const language = swf[p++];

  const wideOffsets = (fontFlags & 0x80) !== 0;
  const hasLayout = (fontFlags & 0x08) !== 0;

  // Font name: null-terminated for Latin (language=0), length-prefixed otherwise
  let fontName: string;
  if (language !== 0) {
    if (p >= swf.length) return null;
    const nameLen = swf[p++];
    if (p + nameLen > swf.length) return null;
    fontName = latin1ToString(swf, p, p + nameLen).replaceAll('\x00', '').trim();
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

  // Offset table: UI16 or UI32 depending on wideOffsets && hasLayout.
  // When hasLayout=false, offsets are always UI16 even if wideOffsets is set.
  const offsetTableStart = p;
  const offsets: number[] = [];
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
  const glyphs: GfxGlyph[] = [];
  for (let gi = 0; gi < numGlyphs; gi++) {
    const gStart = offsetTableStart + offsets[gi];
    const gEnd = offsetTableStart + offsets[gi + 1];
    if (gStart >= swf.length || gEnd > swf.length) {
      glyphs.push({
        index: gi,
        code: 0,
        edges: [],
        segments: [],
        svgPath: '',
      });
      continue;
    }
    const codePoint = readU16LE(swf, codeTablePos + gi * 2);
    const gData = swf.slice(gStart, gEnd);

    try {
      if (gData.length < 1) {
        glyphs.push({
          index: gi,
          code: codePoint,
          edges: [],
          segments: [],
          svgPath: '',
        });
        continue;
      }
      const { edges, segments } = parseGlyphShape(gData);
      const svgPath = glyphEdgesToPath(edges);
      glyphs.push({ index: gi, code: codePoint, edges, segments, svgPath });
    } catch (err) {
      console.warn(`Failed to parse glyph ${gi} (code ${codePoint}) in font ${fontName}`, err);
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
  let layout: FontLayout | null = null;
  if (hasLayout) {
    try {
      let lp = codeTablePos + numGlyphs * 2;
      if (lp + 6 > swf.length) return null;
      const ascent = readU16LE(swf, lp);
      const descent = readU16LE(swf, lp + 2);
      const leading = readU16LE(swf, lp + 4);
      lp += 6;

      const advances: number[] = [];
      for (let i = 0; i < numGlyphs; i++) {
        if (lp + 2 > swf.length) break;
        advances.push(readU16LE(swf, lp));
        lp += 2;
      }

      // Bounds table (RECT per glyph)
      const bounds: Array<{
        xmin: number;
        xmax: number;
        ymin: number;
        ymax: number;
      }> = [];
      for (let i = 0; i < numGlyphs; i++) {
        if (lp >= swf.length) break;
        const br = new BitReader(swf, lp * 8);
        const rect = readRect(br);
        br.alignByte();
        lp = br.bytePos;
        bounds.push(rect);
      }

      // Kerning
      const kerning: Array<{ k1: number; k2: number; adjustment: number }> = [];
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
    } catch (err) {
      console.warn(`Failed to parse font layout for ${fontName}`, err);
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

/**
 * Parse all DefineFont tags (code 48 = DefineFont2, code 75 = DefineFont3)
 * from a decompressed SWF body buffer.
 *
 * The buffer should be the SWF body *after* decompression — it starts at the
 * RECT, NOT including the 8-byte FWS/CWS header.
 *
 * @param swfBody  Decompressed SWF body (starting with RECT)
 * @returns        Array of parsed font descriptors
 */
export function parseSwfFonts(swfBody: Uint8Array): GfxFont[] {
  const header = parseHeader(swfBody);
  const fonts: GfxFont[] = [];
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