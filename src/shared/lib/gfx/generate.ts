/**
 * Batch SVG generation from a GFX file.
 */

import { parseGfx } from './parser';
import { parseShape, shapeToSvg } from './shape';

/**
 * Convert an ArrayBuffer or Uint8Array into an exact-sized ArrayBuffer.
 * A Uint8Array may be a view into a larger buffer, so the slice is required
 * to avoid passing trailing bytes to the parser.
 */
function toArrayBuffer(input: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (input instanceof ArrayBuffer) {
    return input;
  }
  // Create a copy to guarantee an ArrayBuffer (not SharedArrayBuffer).
  return new Uint8Array(input).buffer;
}

/**
 * Parse a GFX file and generate SVG strings for every successfully parsed
 * shape.
 *
 * Returns a record mapping shapeId (characterId) to an SVG string. Shapes
 * that fail to parse (e.g. the known bitmap-fill shapes 469 and 711) are
 * silently skipped.
 */
export async function generateSvgByShapeId(
  input: ArrayBuffer | Uint8Array
): Promise<Record<number, string>> {
  const gfx = await parseGfx(toArrayBuffer(input));

  const svgMap: Record<number, string> = {};

  for (const shapeInfo of gfx.shapes) {
    try {
      const shape = parseShape(gfx.rawSwf, shapeInfo.dataOffset + 2, shapeInfo.code);
      svgMap[shapeInfo.characterId] = shapeToSvg(shape);
    } catch {
      // Skip unparseable shapes (e.g. bitmap fills).
    }
  }

  return svgMap;
}
