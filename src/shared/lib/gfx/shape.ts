/**
 * DefineShape geometry parsing and SVG generation.
 *
 * Shape record format follows the Adobe SWF specification:
 *   - StyleChangeRecord, StraightEdgeRecord, CurvedEdgeRecord, EndShapeRecord
 *   - Important: the NumBits field stores (actual bit count - 2)
 *   - StateNewStyles adds new fill/line styles inside a contour
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

export interface ShapeGroup {
  fill0: number;
  fill1: number;
  line: number;
  segments: Array<[string, ...number[]]>;
}

export interface ParsedShape {
  bounds: { xmin: number; xmax: number; ymin: number; ymax: number };
  fills: FillStyle[];
  lines: LineStyle[];
  groups: ShapeGroup[];
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

  const groups = parseShapeRecords(buf, p, numFillBits, numLineBits, version);

  return { bounds, fills: styles.fills, lines: styles.lines, groups };
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

function parseShapeRecords(
  buf: Uint8Array,
  pos: number,
  numFillBits: number,
  numLineBits: number,
  shapeVersion: number,
): ShapeGroup[] {
  let r = new BitReader(buf, pos * 8);
  let x = 0;
  let y = 0;
  let fill0 = 0;
  let fill1 = 0;
  let line = 0;
  const groups: ShapeGroup[] = [];
  let current: ShapeGroup | null = null;

  const startGroup = (moveX?: number, moveY?: number): ShapeGroup => {
    const group: ShapeGroup = { fill0, fill1, line, segments: [['M', moveX ?? x, moveY ?? y]] };
    groups.push(group);
    return group;
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

      if (sMove) current = startGroup(x, y);

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
  return groups;
}

// ---------- SVG ----------
function colorToCss(c: RgbColor): string {
  if (c.a === 255) {
    return `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }
  return `rgba(${c.r},${c.g},${c.b},${(c.a / 255).toFixed(3)})`;
}

function segmentsToD(
  segments: Array<[string, ...number[]]>,
  scale: number,
  ox: number,
  oy: number,
): string {
  let d = '';
  for (const seg of segments) {
    const [kind, ...args] = seg;
    if (kind === 'M') {
      d += `M${(args[0] * scale + ox).toFixed(2)},${(args[1] * scale + oy).toFixed(2)}`;
    } else if (kind === 'L') {
      d += `L${(args[0] * scale + ox).toFixed(2)},${(args[1] * scale + oy).toFixed(2)}`;
    } else if (kind === 'Q') {
      d += `Q${(args[0] * scale + ox).toFixed(2)},${(args[1] * scale + oy).toFixed(2)} ${(args[2] * scale + ox).toFixed(2)},${(args[3] * scale + oy).toFixed(2)}`;
    }
  }
  return d;
}

/**
 * Build an SVG string from a parsed shape.
 * @param shape - result of parseShape
 * @param scale - scale factor (twips → px, default 1/20)
 */
export function shapeToSvg(shape: ParsedShape, scale = 1 / 20): string {
  const { bounds, fills, lines, groups } = shape;
  const width = ((bounds.xmax - bounds.xmin) * scale).toFixed(2);
  const height = ((bounds.ymax - bounds.ymin) * scale).toFixed(2);
  const ox = -bounds.xmin * scale;
  const oy = -bounds.ymin * scale;

  // Group contours by fill/line index (like JPEXS). A contour can carry both
  // fill0 and fill1, so it is emitted into each corresponding fill group.
  const fillGroups = new Map<number, { fillIndex: number; d: string }>();
  const lineGroups = new Map<number, { lineIndex: number; d: string }>();

  for (const g of groups) {
    if (!g.segments.length) continue;
    const d = segmentsToD(g.segments, scale, ox, oy);

    if (g.fill0 > 0) {
      const key = g.fill0;
      const existing = fillGroups.get(key);
      if (existing) existing.d += d;
      else fillGroups.set(key, { fillIndex: key, d });
    }
    if (g.fill1 > 0) {
      const key = g.fill1;
      const existing = fillGroups.get(key);
      if (existing) existing.d += d;
      else fillGroups.set(key, { fillIndex: key, d });
    }
    if (g.line > 0) {
      const key = g.line;
      const existing = lineGroups.get(key);
      if (existing) existing.d += d;
      else lineGroups.set(key, { lineIndex: key, d });
    }
  }

  const paths: string[] = [];
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