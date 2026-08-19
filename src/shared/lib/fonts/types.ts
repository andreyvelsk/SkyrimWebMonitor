/**
 * Types for the Skyrim SWF font parser (DefineFont2/3).
 */

/** A single edge in a glyph shape. */
export interface GfxGlyphEdge {
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

/** A single glyph in a font. */
export interface GfxGlyph {
  index: number;
  code: number;
  edges: GfxGlyphEdge[];
  segments: unknown[];
  svgPath: string;
}

/** Layout metrics from DefineFont2/3 FontLayout. */
export interface FontLayout {
  ascent: number;
  descent: number;
  leading: number;
  advances: number[];
  bounds: Array<{ xmin: number; xmax: number; ymin: number; ymax: number }>;
  kerning: Array<{ k1: number; k2: number; adjustment: number }>;
}

/** Parsed font from a DefineFont2/3 tag. */
export interface GfxFont {
  fontId: number;
  code: number;
  fontName: string;
  fontFlags: number;
  language: number;
  hasLayout: boolean;
  wideOffsets: boolean;
  numGlyphs: number;
  glyphs: GfxGlyph[];
  layout: FontLayout | null;
  dataStart: number;
  tagLen: number;
}