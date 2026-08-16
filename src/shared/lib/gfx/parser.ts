/**
 * Browser parser for Scaleform GFX (Skyrim HUD).
 *
 * GFX format:
 *   bytes 0-2 : "CFX" signature
 *   byte  3   : version (usually 15)
 *   bytes 4-7 : decompressed stream size (LE)
 *   bytes 8+  : zlib-compressed SWF stream (starting with the RECT FrameSize)
 *
 * After decompression we get the SWF body: RECT, FrameRate, FrameCount, tags.
 */

import type { GfxFile, GfxShapeInfo } from './types';
import { SHAPE_TAGS } from './types';

/**
 * Decompress a GFX file from an ArrayBuffer.
 * Uses the native DecompressionStream (browser) or zlib (Node).
 */
export async function parseGfx(buffer: ArrayBuffer): Promise<GfxFile> {
  const data = new Uint8Array(buffer);

  if (data.length < 8) {
    throw new Error(`File too short: ${data.length} bytes`);
  }

  const signature = String.fromCharCode(data[0], data[1], data[2]);
  const version = data[3];
  void (data[3] | (data[4] << 8) | (data[5] << 16) | (data[6] << 24)); // declared size

  if (signature !== 'CFX') {
    console.warn(`Expected CFX signature, got: ${signature}`);
  }

  // Find the zlib stream (starts with 0x78)
  const payload = data.subarray(8);
  const zlibStart = payload.indexOf(0x78);
  if (zlibStart < 0) {
    throw new Error('zlib stream not found');
  }

  const swf = await inflateZlib(payload.subarray(zlibStart));

  // Parse the SWF header (RECT + FrameRate + FrameCount)
  const reader = new BitReader(swf);
  const nbits = reader.readBits(5);
  const frameSize = {
    xmin: reader.readSignedBits(nbits),
    xmax: reader.readSignedBits(nbits),
    ymin: reader.readSignedBits(nbits),
    ymax: reader.readSignedBits(nbits),
  };
  reader.alignByte();

  const frameRate = readU16LE(swf, reader.bytePos) / 256;
  let pos = reader.bytePos + 4;

  // Parse tags
  const exports = new Map<number, string>();
  const shapes: GfxShapeInfo[] = [];

  while (pos + 2 <= swf.length) {
    const codeAndLen = readU16LE(swf, pos);
    const code = codeAndLen >> 6;
    let len = codeAndLen & 0x3f;
    let headerSize = 2;

    if (len === 0x3f) {
      len = readU32LE(swf, pos + 2);
      headerSize = 6;
    }

    if (code === 0) break; // End

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
        const name = decodeLatin1(swf, p, end);
        p = end + 1;
        exports.set(id, name);
      }
    }

    if (SHAPE_TAGS.has(code)) {
      const characterId = readU16LE(swf, pos + headerSize);
      shapes.push({
        characterId,
        code,
        name: exports.get(characterId) ?? `shape_${characterId}`,
        dataOffset: pos + headerSize,
        length: len,
      });
    }

    pos += headerSize + len;
  }

  return {
    version,
    frameSize,
    frameRate,
    exports,
    shapes,
    rawSwf: swf,
  };
}

// ---------- Helpers ----------

/** Decompress a zlib stream (works in browser and Node) */
async function inflateZlib(data: Uint8Array): Promise<Uint8Array> {
  // Browser DecompressionStream
  if (typeof DecompressionStream !== 'undefined') {
    // `data` is a subarray view; copy it so the Blob receives exactly the
    // zlib stream bytes (not the whole underlying buffer).
    const blob = new Blob([data.slice()]);
    const ds = new DecompressionStream('deflate');
    const stream = blob.stream().pipeThrough(ds);
    const response = new Response(stream);
    const buf = await response.arrayBuffer();
    return new Uint8Array(buf);
  }

  // Node.js fallback (for tests)
  const { inflateSync } = await import('node:zlib');
  return inflateSync(data);
}

function readU16LE(buf: Uint8Array, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8);
}

function readU32LE(buf: Uint8Array, offset: number): number {
  return (
    buf[offset] |
    (buf[offset + 1] << 8) |
    (buf[offset + 2] << 16) |
    (buf[offset + 3] << 24)
  );
}

function decodeLatin1(buf: Uint8Array, start: number, end: number): string {
  let s = '';
  for (let i = start; i < end; i++) {
    s += String.fromCharCode(buf[i]);
  }
  return s;
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