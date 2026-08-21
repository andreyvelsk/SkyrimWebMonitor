import { Font, Glyph, Path } from 'opentype.js';
import type { GfxFont } from './types';

/**
 * Convert a parsed SWF GfxFont to a TTF ArrayBuffer using opentype.js.
 *
 * - unitsPerEm = 1024 (matching Skyrim reference TTF)
 * - `svgPath` is already in px (twips/20 — see `glyphEdgesToPath`), so the
 *   path scale is 1: applying another 1/20 here would shrink glyphs 20×
 *   (matching scripts/gfx/fonts_swf_convert.mjs, which uses pathScale = 1)
 * - SVG font Y-axis is negated relative to OpenType
 */
export function convertFontToTTF(font: GfxFont): ArrayBuffer {
  const unitsPerEm = 1024;
  const pathScale = 1;

  // Ascender / descender from font layout (twips → font units)
  let ascent: number;
  let descent: number;
  if (font.layout) {
    ascent = Math.round(font.layout.ascent / 20);
    descent = -Math.round(font.layout.descent / 20);
  } else {
    ascent = 800;
    descent = -200;
  }

  // opentype.js expects a negative descender (below baseline).
  // Ensure it is negative and has at least a minimal magnitude.
  const otDescender = descent > 0 ? -descent : descent;
  const adjustedDescender = otDescender >= 0 ? -Math.max(otDescender, 300) : otDescender;

  // Build advance-width map from layout advances (twips → font units)
  const advanceMap = new Map<number, number>();
  const defaultAdv = Math.round(unitsPerEm * 0.6);
  if (font.layout && font.layout.advances) {
    for (let i = 0; i < font.layout.advances.length && i < font.glyphs.length; i++) {
      const codePoint = font.glyphs[i].code;
      if (codePoint) {
        advanceMap.set(codePoint, Math.round(font.layout.advances[i] / 20));
      }
    }
  } else {
    advanceMap.set(0, defaultAdv);
  }

  const otGlyphs: Glyph[] = [];
  const unicodeMap: Record<number, number> = {};

  let glyphIndex = 0;
  for (const g of font.glyphs) {
    const codePoint = g.code;
    const svgPath = g.svgPath;

    if (!svgPath || svgPath.length === 0) {
      const notDef = new Glyph({
        name: codePoint
          ? `uni${codePoint.toString(16).toUpperCase().padStart(4, '0')}`
          : '.notdef',
        unicode: codePoint || undefined,
        advanceWidth:
          advanceMap.get(codePoint) ?? advanceMap.get(0) ?? Math.round(unitsPerEm * 0.5),
        path: new Path(),
      });
      otGlyphs.push(notDef);
      if (codePoint) unicodeMap[codePoint] = glyphIndex;
      glyphIndex++;
      continue;
    }

    const otPath = parseSvgPathToOpenType(svgPath, pathScale);

    const advanceWidth =
      advanceMap.get(codePoint) ?? advanceMap.get(0) ?? Math.round(unitsPerEm * 0.6);

    const otGlyph = new Glyph({
      name: codePoint
        ? `uni${codePoint.toString(16).toUpperCase().padStart(4, '0')}`
        : '.notdef',
      unicode: codePoint || undefined,
      advanceWidth,
      path: otPath,
    });

    otGlyphs.push(otGlyph);
    if (codePoint) unicodeMap[codePoint] = glyphIndex;
    glyphIndex++;
  }

  // Build the OpenType font and return as ArrayBuffer
  const otFont = new Font({
    familyName: font.fontName,
    styleName: 'Regular',
    unitsPerEm,
    ascender: ascent,
    descender: adjustedDescender,
    glyphs: otGlyphs,
  });

  return otFont.toArrayBuffer();
}

/**
 * Parse an SVG path 'd' string into an opentype.Path.
 *
 * Supports M (moveTo), L (lineTo), Q (quadratic bezier), Z (closePath) commands.
 *
 * **Y-axis negation**: SVG fonts store coordinates where negative Y = above
 * the baseline, while OpenType uses positive Y = above the baseline. All Y
 * values are negated (and the scale factor is applied) to produce correct
 * OpenType glyphs.
 */
export function parseSvgPathToOpenType(d: string, scale: number = 1): Path {
  const path = new Path();

  // Tokenize: command character followed by optional numbers.
  const tokens = d.match(/[MmLlQqZz][-.\d,\s]*/g) || [];
  let cx = 0;
  let cy = 0; // current position in OpenType coordinates

  for (const token of tokens) {
    const cmd = token[0];
    const argsStr = token.slice(1).trim();
    const args = argsStr
      ? argsStr.split(/[\s,]+/).filter((s) => s !== '').map(Number)
      : [];

    if (cmd === 'M' || cmd === 'm') {
      const isRel = cmd === 'm';
      for (let i = 0; i + 1 < args.length; i += 2) {
        const x = (isRel ? cx + args[i] : args[i]) * scale;
        // NEGATE Y: SVG font has negative Y = up, OpenType has positive Y = up
        const y = (isRel ? cy - args[i + 1] : -args[i + 1]) * scale;
        path.moveTo(x, y);
        cx = x;
        cy = y;
      }
    } else if (cmd === 'L' || cmd === 'l') {
      const isRel = cmd === 'l';
      for (let i = 0; i + 1 < args.length; i += 2) {
        const x = (isRel ? cx + args[i] : args[i]) * scale;
        const y = (isRel ? cy - args[i + 1] : -args[i + 1]) * scale;
        path.lineTo(x, y);
        cx = x;
        cy = y;
      }
    } else if (cmd === 'Q' || cmd === 'q') {
      const isRel = cmd === 'q';
      for (let i = 0; i + 3 < args.length; i += 4) {
        const cpx = (isRel ? cx + args[i] : args[i]) * scale;
        const cpy = (isRel ? cy - args[i + 1] : -args[i + 1]) * scale;
        const x = (isRel ? cx + args[i + 2] : args[i + 2]) * scale;
        const y = (isRel ? cy - args[i + 3] : -args[i + 3]) * scale;
        path.quadraticCurveTo(cpx, cpy, x, y);
        cx = x;
        cy = y;
      }
    } else if (cmd === 'Z' || cmd === 'z') {
      path.closePath();
    }
  }

  return path;
}