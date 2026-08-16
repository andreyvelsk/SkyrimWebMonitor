/**
 * Types for the Scaleform GFX (Skyrim HUD) parser.
 */

/** Information about a DefineShape tag. */
export interface GfxShapeInfo {
  characterId: number;
  code: number; // 2=DefineShape, 22=DefineShape2, 32=DefineShape3, 83=DefineShape4
  name: string;
  dataOffset: number;
  length: number;
}

/** Result of decompressing a GFX file. */
export interface GfxFile {
  /** GFX version */
  version: number;
  /** Frame size in twips (1/20 px) */
  frameSize: { xmin: number; xmax: number; ymin: number; ymax: number };
  /** Frame rate */
  frameRate: number;
  /** Exported symbols (characterId → name) */
  exports: Map<number, string>;
  /** Information about all DefineShape tags */
  shapes: GfxShapeInfo[];
  /** Raw decompressed SWF buffer */
  rawSwf: Uint8Array;
}

/** DefineShape tag codes */
export const SHAPE_TAGS = new Set([2, 22, 32, 83]);