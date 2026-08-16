/// <reference types="node" />

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { base64ToBytes } from '../base64';
import { generateSvgByShapeId } from '../generate';

const GFX_FIXTURE_PATH = 'public/hudmenu.gfx';

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

describe('generateSvgByShapeId', () => {
  it('generates SVG for all parseable shapes in hudmenu.gfx', async () => {
    const buffer = readFileSync(GFX_FIXTURE_PATH);
    const svgMap = await generateSvgByShapeId(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

    const ids = Object.keys(svgMap).map(Number);
    expect(ids.length).toBeGreaterThanOrEqual(400);

    const svg139 = svgMap[139];
    expect(svg139).toBeDefined();
    if (svg139) {
      expect(svg139).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg139).toContain('<path d="');
    }
  });

  it('accepts a Uint8Array input', async () => {
    const buffer = readFileSync(GFX_FIXTURE_PATH);
    const svgMap = await generateSvgByShapeId(new Uint8Array(buffer));
    expect(Object.keys(svgMap).length).toBeGreaterThanOrEqual(400);
  });
});
