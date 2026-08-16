/// <reference types="node" />

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { deflateSync } from 'node:zlib';
import { base64ToBytes } from '../base64';
import { generateSvgByShapeId } from '../generate';

// happy-dom provides a non-functional DecompressionStream that breaks zlib
// decompression. Force the parser to use its node:zlib fallback in tests.
beforeEach(() => {
  vi.stubGlobal('DecompressionStream', undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('base64ToBytes', () => {
  it('decodes a plain base64 string', () => {
    const bytes = base64ToBytes('SGVsbG8=');
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(5);
    expect(String.fromCharCode(...bytes)).toBe('Hello');
  });

  it('strips the data URL prefix', () => {
    const bytes = base64ToBytes('data:text/plain;base64,SGVsbG8=');
    expect(String.fromCharCode(...bytes)).toBe('Hello');
  });
});

// ---------------------------------------------------------------------------
// Minimal synthetic GFX/SWF builder.
//
// public/hudmenu.gfx is a copyrighted asset and cannot be committed, so the
// tests build a tiny, self-contained GFX file from scratch. It contains a
// single DefineShape3 (id 139): a solid red 20x20-twip rectangle. This
// exercises the full pipeline — zlib decompression, SWF header/tag parsing,
// shape parsing and SVG generation — without any external fixture files.
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

/** A closed 20x20-twip rectangle (solid fill, fill index 1). */
function buildRectangleShapeRecords(): number[] {
  const w = new BitWriter();

  // StyleChangeRecord: move to (0,0), set fill0 = 1.
  w.writeBits(0, 1); // typeFlag = 0 (non-edge record)
  w.writeBits(0, 1); // StateNewStyles
  w.writeBits(0, 1); // StateLineStyle
  w.writeBits(0, 1); // StateFillStyle1
  w.writeBits(1, 1); // StateFillStyle0
  w.writeBits(1, 1); // StateMoveTo
  w.writeBits(6, 5); // MoveBits
  w.writeSignedBits(0, 6); // MoveX
  w.writeSignedBits(0, 6); // MoveY
  w.writeBits(1, 1); // Fill0 (numFillBits = 1)

  const straightEdge = (dx: number, dy: number): void => {
    w.writeBits(1, 1); // typeFlag = 1 (edge record)
    w.writeBits(1, 1); // StraightEdge
    w.writeBits(4, 4); // NumBits - 2 (actual NumBits = 6)
    w.writeBits(1, 1); // GeneralLine
    w.writeSignedBits(dx, 6);
    w.writeSignedBits(dy, 6);
  };
  straightEdge(20, 0);
  straightEdge(0, 20);
  straightEdge(-20, 0);
  straightEdge(0, -20);

  // EndShapeRecord.
  w.writeBits(0, 1); // typeFlag = 0
  w.writeBits(0, 1); // StateNewStyles
  w.writeBits(0, 1); // StateLineStyle
  w.writeBits(0, 1); // StateFillStyle1
  w.writeBits(0, 1); // StateFillStyle0
  w.writeBits(0, 1); // StateMoveTo

  w.alignByte();
  return [...w.toBytes()];
}

/** Build a DefineShape3 tag (id 139): a solid red rectangle. */
function buildShapeTag(): number[] {
  const body: number[] = [
    ...u16(139), // ShapeId
    ...writeRect([0, 20, 0, 20]), // ShapeBounds
    0x01, // FillStyleArray: 1 style
    0x00, // solid fill
    0xff, 0x00, 0x00, 0xff, // RGBA red
    0x00, // LineStyleArray: 0 styles
    0x10, // NumFillBits = 1, NumLineBits = 0
    ...buildRectangleShapeRecords(),
  ];
  return tag(32, body); // DefineShape3
}

/** Build an ExportAssets tag mapping characterId 139 to "test_shape". */
function buildExportAssetsTag(): number[] {
  const body: number[] = [...u16(1), ...u16(139)];
  for (const ch of 'test_shape') body.push(ch.charCodeAt(0));
  body.push(0); // null terminator
  return tag(56, body); // ExportAssets
}

/** Build a full synthetic GFX file (CFX header + zlib-compressed SWF). */
function buildGfxFixture(): Uint8Array {
  const swf: number[] = [
    ...writeRect([0, 200, 0, 200]), // FrameSize
    ...u16(0x1800), // FrameRate = 24 fps (24 * 256)
    ...u16(1), // FrameCount
    ...buildShapeTag(),
    ...buildExportAssetsTag(),
    ...tag(0, []), // End
  ];
  const swfBytes = new Uint8Array(swf);
  const compressed = deflateSync(swfBytes);

  const gfx: number[] = [
    0x43, 0x46, 0x58, // "CFX"
    15, // version
    ...u32(swfBytes.length), // decompressed size
    ...compressed, // zlib stream
  ];
  return new Uint8Array(gfx);
}

describe('generateSvgByShapeId', () => {
  it('generates SVG for the synthetic fixture', async () => {
    const fixture = buildGfxFixture();
    // Copy into an exact-sized ArrayBuffer (the parser requires a non-shared
    // ArrayBuffer input, and `fixture.buffer` may be typed as ArrayBufferLike).
    const buffer = new Uint8Array(fixture).buffer;

    const svgMap = await generateSvgByShapeId(buffer);

    expect(Object.keys(svgMap).map(Number)).toEqual([139]);

    const svg139 = svgMap[139];
    expect(svg139).toBeDefined();
    expect(svg139).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg139).toContain('<path d="');
    expect(svg139).toContain('fill="#ff0000"');
  });

  it('accepts a Uint8Array input', async () => {
    const fixture = buildGfxFixture();
    const svgMap = await generateSvgByShapeId(fixture);
    expect(Object.keys(svgMap).map(Number)).toEqual([139]);
  });
});
