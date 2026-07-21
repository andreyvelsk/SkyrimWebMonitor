import type { ReferencePoint } from '../composables/useMapCoordinates';

// =============================================================
// Map configuration types
// =============================================================

export interface ProjectionBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  minU: number;
  minV: number;
  maxU: number;
  maxV: number;
}

export interface ProjectionData {
  source: string;
  meshName: string;
  blockIndex: number;
  texturePaths: string[];
  imageWidth: number;
  imageHeight: number;
  bounds: ProjectionBounds;
  vertexStride: 4;
  triangleStride: 3;
  vertices: number[];
  triangles: number[];
}

export interface ImageCorrectionMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/**
 * Complete configuration for a single map.
 *
 * Each map is identified by its game `worldspace` string (e.g. "Tamriel",
 * "DLC2SolstheimWorld"). The registry maps worldspace → MapConfig so
 * `TheMap.vue` can switch the rendered map dynamically when the player
 * crosses a worldspace boundary.
 */
export interface MapConfig {
  /** Game worldspace EditorID (e.g. "Tamriel"). */
  worldspace: string;
  /** Language of the game, needed for this map */
  language?: string;
  /** URL to the DZI manifest, relative to the app base (e.g. "/map-dzi/tamriel.dzi"). */
  dziUrl: string;
  /** FWMF projection mesh data extracted from the game's BTR file. */
  projectionData: ProjectionData;
  /**
   * Optional affine correction applied to projected image-pixel coordinates.
   * Compensates for slight misalignment between the hand-painted map texture
   * and the FWMF mesh UVs.
   */
  imageCorrection?: ImageCorrectionMatrix;
  /** Pixels to crop from the LEFT and RIGHT edges of the map image. */
  cropX: number;
  /** Pixels to crop from the TOP edge of the map image. */
  cropYTop: number;
  /** Pixels to crop from the BOTTOM edge of the map image. */
  cropYBottom: number;
  /**
   * Calibration reference points for the game-coordinate → image-pixel
   * affine transform. Used by `useMapCoordinates` to fit the least-squares
   * matrix. When absent, the FWMF projection is used as the sole transform.
   */
  referencePoints?: ReferencePoint[];
}

/**
 * Worldspace → MapConfig[] lookup.
 *
 * Each worldspace may have multiple configs differentiated by `language`.
 * When looking up a config, the first entry whose `language` matches the
 * current game locale wins; if no language-specific config is found, the
 * first entry without a `language` (the default) is used.
 */
export type MapRegistry = Record<string, MapConfig[]>;