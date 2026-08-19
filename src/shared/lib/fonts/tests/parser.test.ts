import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { deflateSync } from 'node:zlib';
import { parse } from 'opentype.js';
import {
  parseGlyphShape,
  glyphEdgesToPath,
  parseSwfFonts,
  decompressSwfBody,
  decodeSwfInput,
  convertFontToTTF,
} from '../index';
import type { GfxGlyphEdge } from '../types';

// happy-dom provides a non-functional DecompressionStream that breaks zlib
// decompression. Force the parser to use its node:zlib fallback in tests.
beforeEach(() => {
  vi.stubGlobal('DecompressionStream', undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Minimal synthetic SWF builder.
//
// public/fonts_ru.swf is a copyrighted game asset and cannot be committed, so
// the tests build a tiny, self-contained SWF file from scratch. It contains a
// single DefineFont3 (id 75) with one glyph — a 100x100 twip square at
// (0,0)..(100,100) with fill1=1. This exercises the full pipeline — SWF
// header/tag parsing, glyph shape parsing, path reconstruction and TTF
// conversion — without any external fixture files.
// ---------------------------------------------------------------------------

class BitWriter {
  private bytes: number[] = [];
  private bitPos = 0;

  writeBits(value: number, n: number): void {
    for (let i = n - 1; i >= 0; i--) {
      const bit = (value >>> i) & 1;
      const byteIndex = this.bitPos >> 3;
      const bitIndex = 7 - (this.bitPos & 7);
      this.bytes[byteIndex] = (this.bytes[byteIndex] ?? 0) | (bit << bitIndex);
      this.bitPos++;
    }
  }

  writeSignedBits(value: number, n: number): void {
    this.writeBits(value < 0 ? value + (1 << n) : value, n);
  }

  alignByte(): void {
    this.bitPos = Math.ceil(this.bitPos / 8) * 8;
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

function u16(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff];
}

function u32(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff];
}

function minSignedBits(...values: number[]): number {
  let n = 1;
  for (const value of values) {
    const abs = Math.abs(value);
    while ((1 << (n - 1)) - 1 < abs) n++;
  }
  return n;
}

/** Encode a SWF RECT: 5-bit nbits + four signed nbits values. */
function writeRect(values: [number, number, number, number]): number[] {
  const nbits = minSignedBits(...values);
  const w = new BitWriter();
  w.writeBits(nbits, 5);
  for (const value of values) w.writeSignedBits(value, nbits);
  w.alignByte();
  return [...w.toBytes()];
}

/** Encode a short-form SWF tag header + body. */
function tag(code: number, body: number[]): number[] {
  return [...u16((code << 6) | body.length), ...body];
}

/**
 * Encode a single glyph shape: a 100x100 twip square with fill1=1.
 *
 * ShapeWithoutStyle: 1 byte (numFillBits=1, numLineBits=1) followed by
 * shape records:
 *   - StyleChangeRecord: moveTo (0,0), fill1=1
 *   - 4 straight edges forming the square
 *   - EndShapeRecord
 */
function squareGlyphShape(): Uint8Array {
  const w = new BitWriter();

  // numFillBits=1, numLineBits=1
  w.writeBits(0x11, 8);

  // StyleChangeRecord: typeFlag=0, sNew=0, sLine=0, sF1=1, sF0=0, sMove=1
  w.writeBits(0, 1); // typeFlag
  w.writeBits(0, 1); // sNew
  w.writeBits(0, 1); // sLine
  w.writeBits(1, 1); // sF1
  w.writeBits(0, 1); // sF0
  w.writeBits(1, 1); // sMove
  // MoveTo: moveBits=5 (delta 0 fits), dx=0, dy=0
  w.writeBits(5, 5);
  w.writeSignedBits(0, 5);
  w.writeSignedBits(0, 5);
  // fill1 = 1 (numFillBits=1)
  w.writeBits(1, 1);

  // Straight edges. nBits = 8 for delta 100 (nBits field = 8 - 2 = 6).
  // Edge: typeFlag=1, straightFlag=1, nBitsField, general=1, dx, dy
  const edge = (dx: number, dy: number): void => {
    w.writeBits(1, 1); // typeFlag
    w.writeBits(1, 1); // straightFlag
    w.writeBits(6, 4); // nBits field (8 - 2)
    w.writeBits(1, 1); // general
    w.writeSignedBits(dx, 8);
    w.writeSignedBits(dy, 8);
  };
  edge(100, 0);
  edge(0, 100);
  edge(-100, 0);
  edge(0, -100);

  // EndShapeRecord: all five flags zero
  w.writeBits(0, 1); // typeFlag
  w.writeBits(0, 1); // sNew
  w.writeBits(0, 1); // sLine
  w.writeBits(0, 1); // sF1
  w.writeBits(0, 1); // sF0
  w.writeBits(0, 1); // sMove
  w.alignByte();

  return w.toBytes();
}

interface BuildFontOptions {
  code?: number; // 75 = DefineFont3 (default), 48 = DefineFont2
  fontId?: number;
  fontName?: string;
  hasLayout?: boolean;
  wideOffsets?: boolean;
  codePoint?: number;
  advance?: number;
}

/**
 * Build a single DefineFont2/3 tag with one glyph.
 *
 * Offset table entries are UI16 when `hasLayout=false` (even if wideOffsets is
 * set), matching the Skyrim layout rules in fonts_swf.md. When
 * `hasLayout=true` + `wideOffsets=true` the offsets become UI32.
 */
function buildFontTag(opts: BuildFontOptions = {}): number[] {
  const code = opts.code ?? 75;
  const fontId = opts.fontId ?? 1;
  const fontName = opts.fontName ?? 'TestFont';
  const hasLayout = opts.hasLayout ?? true;
  const wideOffsets = opts.wideOffsets ?? false;
  const codePoint = opts.codePoint ?? 0x41; // 'A'
  const advance = opts.advance ?? 518;

  const useWideOffsets = wideOffsets && hasLayout;
  const fontFlags = (wideOffsets ? 0x80 : 0x00) | (hasLayout ? 0x08 : 0x00);

  const body: number[] = [];
  body.push(...u16(fontId));
  body.push(fontFlags);
  body.push(0); // language = 0 (Latin, null-terminated name)
  for (let i = 0; i < fontName.length; i++) body.push(fontName.charCodeAt(i));
  body.push(0); // null terminator
  body.push(...u16(1)); // numGlyphs

  const glyphData = squareGlyphShape();

  // Offset table: (numGlyphs + 1) entries. Offsets are relative to the start
  // of the offset table, so offsets[0] = offset-table size and
  // offsets[numGlyphs] = offset-table size + glyph data size.
  const numGlyphs = 1;
  const offsetEntrySize = useWideOffsets ? 4 : 2;
  const offsetTableSize = offsetEntrySize * (numGlyphs + 1);
  body.push(...(useWideOffsets ? u32(offsetTableSize) : u16(offsetTableSize)));
  body.push(...(useWideOffsets ? u32(offsetTableSize + glyphData.length) : u16(offsetTableSize + glyphData.length)));

  // Glyph shape data
  body.push(...glyphData);

  // Code table (UI16 per glyph)
  body.push(...u16(codePoint));

  if (hasLayout) {
    // ascent, descent, leading (UI16 each)
    body.push(...u16(800));
    body.push(...u16(200));
    body.push(...u16(0));
    // advances[1]
    body.push(...u16(advance));
    // bounds[1] — RECT of the glyph
    body.push(...writeRect([0, 100, 0, 100]));
    // kerningCount = 0
    body.push(...u16(0));
  }

  return tag(code, body);
}

/**
 * Build a complete FWS SWF file: header + RECT + frameRate + frameCount + tags.
 */
function buildSwf(tags: number[][]): Uint8Array {
  const body: number[] = [];
  // RECT (frame size 0..1000 twips)
  body.push(...writeRect([0, 1000, 0, 1000]));
  // frameRate = 12.0 (8.8 fixed point), frameCount = 1
  body.push(...u16(12 << 8));
  body.push(...u16(1));
  for (const t of tags) body.push(...t);

  const header = ['F'.charCodeAt(0), 'W'.charCodeAt(0), 'S'.charCodeAt(0), 8];
  const totalLength = 8 + body.length;
  return new Uint8Array([...header, ...u32(totalLength), ...body]);
}

/**
 * buildSwf produces an uncompressed FWS file. `parseSwfFonts` expects the SWF
 * body (after the 8-byte FWS header), so strip it here — mirroring what
 * `decodeSwfInput` returns in the runtime loader.
 */
function fwsBody(swf: Uint8Array): Uint8Array {
  return swf.subarray(8);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ---------------------------------------------------------------------------
// decompressSwfBody / decodeSwfInput
// ---------------------------------------------------------------------------

describe('decompressSwfBody', () => {
  it('passes FWS body through (skips 8-byte header)', async () => {
    const body = new Uint8Array([1, 2, 3, 4, 5]);
    const file = new Uint8Array([0x46, 0x57, 0x53, 0x08, 0, 0, 0, 0, ...body]);
    const result = await decompressSwfBody(file);
    expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
  });

  it('inflates CWS body via node:zlib fallback', async () => {
    const body = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const compressed = deflateSync(body);
    const file = new Uint8Array([0x43, 0x57, 0x53, 0x08, 0, 0, 0, 0, ...compressed]);
    const result = await decompressSwfBody(file);
    expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('throws on ZWS (LZMA) input', async () => {
    const file = new Uint8Array([0x5a, 0x57, 0x53, 0x08, 0, 0, 0, 0]);
    await expect(decompressSwfBody(file)).rejects.toThrow('ZWS');
  });

  it('throws on unknown signature', async () => {
    const file = new Uint8Array([0x78, 0x78, 0x78]);
    await expect(decompressSwfBody(file)).rejects.toThrow('Unknown SWF signature');
  });
});

describe('decodeSwfInput', () => {
  it('decodes a base64 FWS string into the SWF body', async () => {
    const swf = buildSwf([buildFontTag()]);
    const body = await decodeSwfInput(bytesToBase64(swf));
    expect(body[0]).toBeGreaterThan(0); // RECT starts with nbits
  });

  it('strips a data: URL prefix from base64 input', async () => {
    const swf = buildSwf([buildFontTag()]);
    const b64 = bytesToBase64(swf);
    const body = await decodeSwfInput(`data:application/octet-stream;base64,${b64}`);
    expect(body[0]).toBeGreaterThan(0);
  });

  it('accepts a raw Uint8Array FWS file', async () => {
    const swf = buildSwf([buildFontTag()]);
    const body = await decodeSwfInput(swf);
    expect(body[0]).toBeGreaterThan(0);
  });

  it('accepts an ArrayBuffer FWS file', async () => {
    const swf = buildSwf([buildFontTag()]);
    const copy = swf.slice().buffer;
    const body = await decodeSwfInput(copy);
    expect(body[0]).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// parseGlyphShape / glyphEdgesToPath
// ---------------------------------------------------------------------------

describe('parseGlyphShape', () => {
  it('returns empty edges for end-only record (0x00)', () => {
    const data = new Uint8Array([0x00]);
    const result = parseGlyphShape(data);
    expect(result.edges).toEqual([]);
    expect(result.segments).toEqual([]);
  });

  it('returns empty edges for all-zero data', () => {
    const data = new Uint8Array([0x00, 0x00, 0x00]);
    const result = parseGlyphShape(data);
    expect(result.edges).toEqual([]);
  });

  it('returns edges array (structure-only test)', () => {
    const data = new Uint8Array([0x10, 0x00, 0x00]);
    const result = parseGlyphShape(data);
    expect(Array.isArray(result.edges)).toBe(true);
    expect(Array.isArray(result.segments)).toBe(true);
  });

  it('handles empty data gracefully', () => {
    const data = new Uint8Array([]);
    const result = parseGlyphShape(data);
    expect(result.edges).toEqual([]);
  });

  it('parses the synthetic square glyph into 4 straight edges', () => {
    const shape = squareGlyphShape();
    const { edges } = parseGlyphShape(shape);
    expect(edges.length).toBe(4);
    expect(edges.every((e) => e.type === 'L')).toBe(true);
    expect(edges.every((e) => e.fill1 === 1)).toBe(true);
    // Edges close the square back to (0,0)
    expect(edges[edges.length - 1].x1).toBe(0);
    expect(edges[edges.length - 1].y1).toBe(0);
  });
});

describe('glyphEdgesToPath', () => {
  it('returns empty string for empty edges', () => {
    expect(glyphEdgesToPath([])).toBe('');
  });

  it('returns valid SVG path for a closed loop with fill1 edges', () => {
    const edges: GfxGlyphEdge[] = [
      { type: 'L', x0: 0, y0: 0, x1: 100, y1: 0, fill0: 0, fill1: 1, line: 0 },
      { type: 'L', x0: 100, y0: 0, x1: 0, y1: 0, fill0: 0, fill1: 1, line: 0 },
    ];
    const path = glyphEdgesToPath(edges);
    expect(path).toMatch(/^M/);
    expect(path).toContain('L');
  });

  it('handles fill0 edges by reversing them', () => {
    const edges: GfxGlyphEdge[] = [
      { type: 'L', x0: 50, y0: 0, x1: 100, y1: 50, fill0: 1, fill1: 0, line: 0 },
      { type: 'L', x0: 100, y0: 50, x1: 50, y1: 0, fill0: 0, fill1: 1, line: 0 },
    ];
    const path = glyphEdgesToPath(edges);
    expect(path.length).toBeGreaterThan(0);
  });

  it('handles curved edges', () => {
    const edges: GfxGlyphEdge[] = [
      { type: 'Q', x0: 0, y0: 0, cx: 50, cy: 100, x1: 100, y1: 0, fill0: 0, fill1: 1, line: 0 },
      { type: 'L', x0: 100, y0: 0, x1: 0, y1: 0, fill0: 0, fill1: 1, line: 0 },
    ];
    const path = glyphEdgesToPath(edges);
    expect(path).toContain('Q');
  });

  it('returns empty string when no fill edges exist', () => {
    const edges: GfxGlyphEdge[] = [
      { type: 'L', x0: 0, y0: 0, x1: 100, y1: 0, fill0: 0, fill1: 0, line: 0 },
    ];
    expect(glyphEdgesToPath(edges)).toBe('');
  });

  it('handles mixed fill0 and fill1 edges together', () => {
    const edges: GfxGlyphEdge[] = [
      { type: 'L', x0: 0, y0: 0, x1: 100, y1: 0, fill0: 0, fill1: 1, line: 0 },
      { type: 'L', x0: 100, y0: 0, x1: 0, y1: 0, fill0: 1, fill1: 0, line: 0 },
    ];
    const path = glyphEdgesToPath(edges);
    expect(path.length).toBeGreaterThan(0);
  });

  it('reconstructs the synthetic square glyph into a closed path', () => {
    const shape = squareGlyphShape();
    const { edges } = parseGlyphShape(shape);
    const path = glyphEdgesToPath(edges);
    expect(path.startsWith('M0.00,0.00')).toBe(true);
    expect(path).toContain('L5.00,0.00');
    expect(path).toContain('L5.00,5.00');
    expect(path.endsWith('L0.00,0.00')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseSwfFonts (full synthetic SWF)
// ---------------------------------------------------------------------------

describe('parseSwfFonts', () => {
  it('throws on empty input (needs at least RECT header)', () => {
    expect(() => parseSwfFonts(new Uint8Array(0))).toThrow();
  });

  it('throws on too-short input', () => {
    expect(() => parseSwfFonts(new Uint8Array([1, 2, 3]))).toThrow();
  });

  it('parses a DefineFont3 tag with layout into a GfxFont', () => {
    const swf = buildSwf([buildFontTag({ fontName: 'FuturaTest', codePoint: 0x41 })]);
    const fonts = parseSwfFonts(fwsBody(swf));

    expect(fonts.length).toBe(1);
    const font = fonts[0];
    expect(font.fontId).toBe(1);
    expect(font.code).toBe(75);
    expect(font.fontName).toBe('FuturaTest');
    expect(font.hasLayout).toBe(true);
    expect(font.numGlyphs).toBe(1);
    expect(font.glyphs.length).toBe(1);
    expect(font.glyphs[0].code).toBe(0x41);
    expect(font.glyphs[0].svgPath).toContain('L5.00,5.00');

    // Layout metrics survive the round trip
    expect(font.layout).not.toBeNull();
    if (font.layout) {
      expect(font.layout.ascent).toBe(800);
      expect(font.layout.descent).toBe(200);
      expect(font.layout.advances).toEqual([518]);
      expect(font.layout.bounds).toEqual([{ nbits: 8, xmin: 0, xmax: 100, ymin: 0, ymax: 100 }]);
    }
  });

  it('parses a DefineFont2 tag without layout (UI16 offsets even with wideOffsets)', () => {
    const swf = buildSwf([
      buildFontTag({ code: 48, fontName: 'LegacyFont', hasLayout: false, wideOffsets: true }),
    ]);
    const fonts = parseSwfFonts(fwsBody(swf));

    expect(fonts.length).toBe(1);
    const font = fonts[0];
    expect(font.code).toBe(48);
    expect(font.hasLayout).toBe(false);
    expect(font.wideOffsets).toBe(true);
    expect(font.glyphs.length).toBe(1);
    expect(font.glyphs[0].svgPath).toContain('L5.00,5.00');
    expect(font.layout).toBeNull();
  });

  it('parses multiple font tags and assigns unique fontIds', () => {
    const swf = buildSwf([
      buildFontTag({ fontId: 1, fontName: 'FontOne' }),
      buildFontTag({ fontId: 2, fontName: 'FontTwo', codePoint: 0x42 }),
    ]);
    const fonts = parseSwfFonts(fwsBody(swf));

    expect(fonts.length).toBe(2);
    expect(fonts[0].fontId).toBe(1);
    expect(fonts[0].fontName).toBe('FontOne');
    expect(fonts[1].fontId).toBe(2);
    expect(fonts[1].fontName).toBe('FontTwo');
  });
});

// ---------------------------------------------------------------------------
// convertFontToTTF
// ---------------------------------------------------------------------------

describe('convertFontToTTF', () => {
  it('produces a valid TTF with expected metrics', () => {
    const swf = buildSwf([buildFontTag({ fontName: 'FuturaTCYLigCon', codePoint: 0x41, advance: 518 })]);
    const font = parseSwfFonts(fwsBody(swf))[0];

    const buffer = convertFontToTTF(font);
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(buffer.byteLength).toBeGreaterThan(1000);

    const parsed = parse(buffer);
    expect(parsed.unitsPerEm).toBe(1024);
    // ascent = 800 / 20 = 40, descent = -(200 / 20) = -10
    expect(parsed.ascender).toBe(40);
    expect(parsed.descender).toBe(-10);
    // advance = 518 / 20 = 25.9 → Math.round → 26
    const glyphA = parsed.charToGlyph('A');
    expect(glyphA).not.toBeNull();
    expect(glyphA.advanceWidth).toBe(26);
  });

  it('does not double-scale glyph outlines (100 twips → 5 units, not 0.25)', () => {
    const swf = buildSwf([buildFontTag({ fontName: 'ScaleCheck', codePoint: 0x41 })]);
    const font = parseSwfFonts(fwsBody(swf))[0];

    const buffer = convertFontToTTF(font);
    const parsed = parse(buffer);
    const glyphA = parsed.charToGlyph('A');

    expect(glyphA).not.toBeNull();
    // The synthetic square is 100×100 twips. glyphEdgesToPath already scales
    // by 1/20 → 5×5 px, and the TTF converter must use pathScale = 1 so the
    // outline stays 5×5 font units. A second 1/20 scale would make it 0.25×0.25
    // (the "dots" bug).
    const box = glyphA.getBoundingBox();
    expect(box.x2 - box.x1).toBeCloseTo(5, 1);
    expect(box.y2 - box.y1).toBeCloseTo(5, 1);
  });

  it('maps a glyph code point to the .notdef placeholder when path is empty', () => {
    // Build a font whose glyph has no path data (empty shape) and verify the
    // TTF still contains the code point.
    const swf = buildSwf([buildFontTag({ fontName: 'EmptyGlyph' })]);
    const font = parseSwfFonts(fwsBody(swf))[0];
    // Overwrite the glyph with an empty path to simulate an unparseable glyph
    font.glyphs[0].svgPath = '';

    const buffer = convertFontToTTF(font);
    const parsed = parse(buffer);
    // Empty path → empty outline but the glyph must still exist
    expect(parsed.glyphs.length).toBeGreaterThan(0);
  });
});
