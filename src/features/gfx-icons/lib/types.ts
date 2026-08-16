/**
 * Types for the gfx-icons feature.
 */

/** Metadata stored alongside cached icons to track readiness. */
export interface GfxIconsManifest {
  /** Whether the full icon set was successfully cached. */
  ready: boolean;
  /** Number of SVG shapes stored. */
  shapeCount: number;
  /** Shape ids persisted in this cache set. */
  shapeIds: number[];
  /** ISO-8601 timestamp of when the cache was generated. */
  generatedAt: string;
}