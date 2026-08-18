/**
 * DefineShape geometry parsing and SVG generation.
 *
 * Shape record format follows the Adobe SWF specification:
 *   - StyleChangeRecord, StraightEdgeRecord, CurvedEdgeRecord, EndShapeRecord
 *   - Important: the NumBits field stores (actual bit count - 2)
 *   - StateNewStyles adds new fill/line styles inside a contour
 *
 * Fill rendering is JPEXS-style: every edge carries the fill0/fill1/line
 * values active at the time it was read, and closed subpaths are rebuilt by
 * endpoint matching. This correctly handles Scaleform's mid-contour fill
 * changes (a StyleChangeRecord that changes fill0/fill1 without a MoveTo).
 */

// ---------- Types ----------
export interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FillStyle {
  type: 'solid' | 'linear' | 'radial' | 'focal' | 'bitmap' | 'unknown';
  color?: RgbColor;
  records?: Array<{ ratio: number; color: RgbColor }>;
}

export interface LineStyle {
  width: number;
  color: RgbColor;
}

/**
 * Legacy contour structure grouped only on explicit MoveTo. Each contour has
 * a SINGLE fill0/fill1 captured at MoveTo time — this is NOT reliable when a
 * mid-contour StyleChangeRecord changes fill0/fill1 without a MoveTo. Do not
 * use `contours` for fill rendering.
 */
export interface ShapeContour {
  fill0: number;
  fill1: number;
  line: number;
  segments: Array<[string, ...number[]]>;
}

/**
 * A single straight/curved edge carrying the fill0/fill1/line values that
 * were active AT THE TIME the edge was read. This is the correct input for
 * path reconstruction in `shapeToSvg`.
 */
export interface ShapeEdge {
  type: 'L' | 'Q';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx?: number;
  cy?: number;
  fill0: number;
  fill1: number;
  line: number;
}

export interface ParsedShape {
  bounds: { xmin: number; xmax: number; ymin: number; ymax: number };
  fills: FillStyle[];
  lines: LineStyle[];
  contours: ShapeContour[];
  edges: ShapeEdge[];
}

// ---------- BitReader ----------
class BitReader {
  private buf: Uint8Array;
  private bitPos: number;

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
    if (n > 0 && (v & (1 << (n - 1)))) {
      return v - (1 << n);
    }
    return v;
  }

  alignByte(): void {
    this.bitPos = Math.ceil(this.bitPos / 8) * 8;
  }

  get bytePos(): number {
    return this.bitPos >> 3;
  }
}

// ---------- Helpers ----------
function readU16LE(buf: Uint8Array, offset: number): number {
  if (offset < 0 || offset + 2 > buf.length) {
    throw new RangeError(`The value of "offset" is out of range (offset=${offset}, length=${buf.length})`);
  }
  return buf[offset] | (buf[offset + 1] << 8);
}

const SHAPE_VERSION: Record<number, number> = { 2: 1, 22: 2, 32: 3, 83: 4 };

/**
 * Parse a DefineShape tag.
 * @param buf - decompressed SWF buffer
 * @param pos - byte offset of the tag data start (after ShapeId)
 * @param code - tag code (2, 22, 32, 83)
 */
export function parseShape(buf: Uint8Array, pos: number, code: number): ParsedShape {
  // ShapeId has already been read by the caller
  const version = SHAPE_VERSION[code] ?? 3;

  // ShapeBounds RECT
  const boundsReader = new BitReader(buf, pos * 8);
  const nbits = boundsReader.readBits(5);
  const bounds = {
    xmin: boundsReader.readSignedBits(nbits),
    xmax: boundsReader.readSignedBits(nbits),
    ymin: boundsReader.readSignedBits(nbits),
    ymax: boundsReader.readSignedBits(nbits),
  };
  boundsReader.alignByte();
  let p = boundsReader.bytePos;

  // DefineShape4: EdgeBounds + flags
  if (version >= 4) {
    const eb = new BitReader(buf, p * 8);
    const ebNbits = eb.readBits(5);
    eb.readSignedBits(ebNbits);
    eb.readSignedBits(ebNbits);
    eb.readSignedBits(ebNbits);
    eb.readSignedBits(ebNbits);
    eb.alignByte();
    p = eb.bytePos + 1; // + flags byte
  }

  // Fill/Line styles
  const styles = parseStyles(buf, p, version);
  p = styles.pos;

  const numFillBits = buf[p] >> 4;
  const numLineBits = buf[p] & 0x0f;
  p += 1;

  const { contours, edges } = parseShapeRecords(buf, p, numFillBits, numLineBits, version);

  return { bounds, fills: styles.fills, lines: styles.lines, contours, edges };
}

function parseStyles(
  buf: Uint8Array,
  pos: number,
  shapeVersion: number,
): { pos: number; fills: FillStyle[]; lines: LineStyle[] } {
  let p = pos;

  // FILLSTYLEARRAY
  let fillCount = buf[p];
  p += 1;
  if (fillCount === 0xff) {
    fillCount = readU16LE(buf, p);
    p += 2;
  }
  const fills: FillStyle[] = [];
  for (let i = 0; i < fillCount; i++) {
    const type = buf[p];
    p += 1;
    if (type === 0x00) {
      // solid
      const color = shapeVersion >= 3 ? readRGBA(buf, p) : { ...readRGB(buf, p), a: 255 };
      p += shapeVersion >= 3 ? 4 : 3;
      fills.push({ type: 'solid', color });
    } else if (type === 0x10 || type === 0x12 || type === 0x13) {
      // Scaleform GFx gradients always have a MATRIX
      p = skipMatrix(buf, p);
      const packed = buf[p];
      p += 1;
      const numGrads = packed & 0x0f;
      const records: Array<{ ratio: number; color: RgbColor }> = [];
      for (let g = 0; g < numGrads; g++) {
        const ratio = buf[p];
        p += 1;
        const color = shapeVersion >= 3 ? readRGBA(buf, p) : { ...readRGB(buf, p), a: 255 };
        p += shapeVersion >= 3 ? 4 : 3;
        records.push({ ratio, color });
      }
      if (type === 0x13) {
        p += 2; // focal point (fixed8)
      }
      fills.push({
        type: type === 0x10 ? 'linear' : type === 0x12 ? 'radial' : 'focal',
        records,
      });
    } else if (type >= 0x40 && type <= 0x43) {
      // bitmap fill — skip
      p += 2; // bitmapId
      p = skipMatrix(buf, p);
      fills.push({ type: 'bitmap' });
    } else {
      // Unknown type — stop reading fill styles
      break;
    }
  }

  // LINESTYLEARRAY
  let lineCount = buf[p];
  p += 1;
  if (lineCount === 0xff) {
    lineCount = readU16LE(buf, p);
    p += 2;
  }
  const lines: LineStyle[] = [];
  for (let i = 0; i < lineCount; i++) {
    const width = readU16LE(buf, p);
    p += 2;
    if (shapeVersion >= 4) {
      // LineStyle2: width + flags (UI16) + color
      p += 2; // flags
    }
    const color = shapeVersion >= 3 ? readRGBA(buf, p) : { ...readRGB(buf, p), a: 255 };
    p += shapeVersion >= 3 ? 4 : 3;
    lines.push({ width, color });
  }

  return { pos: p, fills, lines };
}

function readRGB(buf: Uint8Array, pos: number): RgbColor {
  return { r: buf[pos], g: buf[pos + 1], b: buf[pos + 2], a: 255 };
}

function readRGBA(buf: Uint8Array, pos: number): RgbColor {
  return { r: buf[pos], g: buf[pos + 1], b: buf[pos + 2], a: buf[pos + 3] };
}

/** Skip a MATRIX record using BitReader for accurate offset tracking. */
function skipMatrix(buf: Uint8Array, pos: number): number {
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

/**
 * Parse shape records.
 *
 * Returns `{ contours, edges }`:
 * - `contours`: legacy structure grouped only on explicit MoveTo (display
 *   only). Each contour has a SINGLE fill0/fill1 captured at MoveTo time and
 *   is NOT reliable for fill rendering.
 * - `edges`: a flat list of individual edges (straight/curved), each carrying
 *   the fill0/fill1/line values active AT THE TIME the edge was read. This
 *   correctly captures mid-contour fill changes and is the correct input for
 *   path reconstruction in `shapeToSvg`.
 */
function parseShapeRecords(
  buf: Uint8Array,
  pos: number,
  numFillBits: number,
  numLineBits: number,
  shapeVersion: number,
): { contours: ShapeContour[]; edges: ShapeEdge[] } {
  let r = new BitReader(buf, pos * 8);
  let x = 0;
  let y = 0;
  let fill0 = 0;
  let fill1 = 0;
  let line = 0;
  const contours: ShapeContour[] = [];
  const edges: ShapeEdge[] = [];
  let current: ShapeContour | null = null;

  const beginContour = (moveX?: number, moveY?: number): ShapeContour => {
    const contour: ShapeContour = { fill0, fill1, line, segments: [['M', moveX ?? x, moveY ?? y]] };
    contours.push(contour);
    return contour;
  };

  while (true) {
    const typeFlag = r.readBits(1);
    if (typeFlag === 0) {
      const sNew = r.readBits(1);
      const sLine = r.readBits(1);
      const sF1 = r.readBits(1);
      const sF0 = r.readBits(1);
      const sMove = r.readBits(1);
      if (!sNew && !sLine && !sF1 && !sF0 && !sMove) break; // EndShapeRecord

      if (sMove) {
        const moveBits = r.readBits(5);
        x = r.readSignedBits(moveBits);
        y = r.readSignedBits(moveBits);
      }
      if (sF0) fill0 = r.readBits(numFillBits);
      if (sF1) fill1 = r.readBits(numFillBits);
      if (sLine) line = r.readBits(numLineBits);

      if (sMove) current = beginContour(x, y);

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
        const x0 = x;
        const y0 = y;
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
        const x0 = x;
        const y0 = y;
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

// ---------- SVG ----------
function colorToCss(c: RgbColor): string {
  if (c.a === 255) {
    return `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }
  return `rgba(${c.r},${c.g},${c.b},${(c.a / 255).toFixed(3)})`;
}

/** Edge geometry without fill/line attributes (used after reversing). */
interface EdgeGeometry {
  type: 'L' | 'Q';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx?: number;
  cy?: number;
}

/**
 * Reverse a single edge so it goes from x1,y1 back to x0,y0.
 * For a curve, the control point stays the same — only the anchor
 * endpoints (x0,y0)/(x1,y1) swap.
 */
function reverseEdge(e: ShapeEdge): EdgeGeometry {
  if (e.type === 'Q') return { type: 'Q', x0: e.x1, y0: e.y1, cx: e.cx, cy: e.cy, x1: e.x0, y1: e.y0 };
  return { type: 'L', x0: e.x1, y0: e.y1, x1: e.x0, y1: e.y0 };
}

function pointKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Reconstruct closed SVG subpaths from an unordered bag of edges by
 * matching endpoints (JPEXS-style path reconstruction).
 */
function reconstructPaths(edgeBag: EdgeGeometry[]): EdgeGeometry[][] {
  const byStart = new Map<string, number[]>();
  const used = new Array<boolean>(edgeBag.length).fill(false);
  for (let i = 0; i < edgeBag.length; i++) {
    const key = pointKey(edgeBag[i].x0, edgeBag[i].y0);
    if (!byStart.has(key)) byStart.set(key, []);
    byStart.get(key)?.push(i);
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

  const loops: EdgeGeometry[][] = [];
  for (let i = 0; i < edgeBag.length; i++) {
    if (used[i]) continue;
    const startEdge = edgeBag[i];
    used[i] = true;
    const loop: EdgeGeometry[] = [startEdge];
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

function loopToD(loop: EdgeGeometry[], scale: number, ox: number, oy: number): string {
  const px = (v: number): string => (v * scale + ox).toFixed(2);
  const py = (v: number): string => (v * scale + oy).toFixed(2);
  let d = `M${px(loop[0].x0)},${py(loop[0].y0)}`;
  for (const e of loop) {
    if (e.type === 'L') d += `L${px(e.x1)},${py(e.y1)}`;
    else d += `Q${px(e.cx ?? e.x0)},${py(e.cy ?? e.y0)} ${px(e.x1)},${py(e.y1)}`;
  }
  return d;
}

/**
 * Build per-fill-index path data ('d' strings) from the flat edge list using
 * endpoint-matching reconstruction. Returns Map<fillIndex, string>.
 */
function buildFillPathsFromEdges(
  edges: ShapeEdge[],
  scale: number,
  ox: number,
  oy: number,
): Map<number, string> {
  const bags = new Map<number, EdgeGeometry[]>();
  const addTo = (idx: number, edge: EdgeGeometry): void => {
    if (!bags.has(idx)) bags.set(idx, []);
    bags.get(idx)?.push(edge);
  };
  for (const e of edges) {
    if (e.fill1 > 0) addTo(e.fill1, e);
    if (e.fill0 > 0) addTo(e.fill0, reverseEdge(e));
  }

  const result = new Map<number, string>();
  for (const [fillIndex, bag] of bags) {
    const loops = reconstructPaths(bag);
    const d = loops.map((loop) => loopToD(loop, scale, ox, oy)).join('');
    result.set(fillIndex, d);
  }
  return result;
}

/**
 * Build per-line-index path data using the same endpoint-matching
 * reconstruction.
 */
function buildLinePathsFromEdges(
  edges: ShapeEdge[],
  scale: number,
  ox: number,
  oy: number,
): Map<number, string> {
  const bags = new Map<number, EdgeGeometry[]>();
  for (const e of edges) {
    if (e.line > 0) {
      if (!bags.has(e.line)) bags.set(e.line, []);
      bags.get(e.line)?.push(e);
    }
  }
  const result = new Map<number, string>();
  for (const [lineIndex, bag] of bags) {
    const loops = reconstructPaths(bag);
    const d = loops.map((loop) => loopToD(loop, scale, ox, oy)).join('');
    result.set(lineIndex, d);
  }
  return result;
}

/**
 * Build an SVG string from a parsed shape.
 * @param shape - result of parseShape
 * @param scale - scale factor (twips → px, default 1/20)
 */
export function shapeToSvg(shape: ParsedShape, scale = 1 / 20): string {
  const { bounds, fills, lines, edges } = shape;
  const width = ((bounds.xmax - bounds.xmin) * scale).toFixed(2);
  const height = ((bounds.ymax - bounds.ymin) * scale).toFixed(2);
  const ox = -bounds.xmin * scale;
  const oy = -bounds.ymin * scale;

  // JPEXS-style rendering: fill1 edges as-is + fill0 edges reversed,
  // reconstructed into closed loops by endpoint matching. This correctly
  // handles mid-contour fill changes (StyleChangeRecord without MoveTo).
  const fillPaths = buildFillPathsFromEdges(edges, scale, ox, oy);
  const linePaths = buildLinePathsFromEdges(edges, scale, ox, oy);

  const paths: string[] = [];
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
