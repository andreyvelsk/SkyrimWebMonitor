import type { KnownMapHotspotType } from '@/stores/map/lib/types';

/**
 * Types for the gfx-icons feature.
 */

/** Shape ids for a single hotspot type, split by fast-travel state. */
export interface GfxShapeIdByFastTravel {
  /** Shape id for discovered locations (canFastTravel: true). */
  known: number;
  /** Shape id for undiscovered locations (canFastTravel: false). */
  undiscovered: number;
}

/** Mapping from hotspot type to GFX shape ids. */
export type TypeToGfxShapeIdMap = Readonly<
  Partial<Record<KnownMapHotspotType, GfxShapeIdByFastTravel>>
>;

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

/** A single cached SVG icon record in the `icons` object store. */
export interface GfxIconRecord {
  /** Shape id (characterId) — the primary key. */
  shapeId: number;
  /** SVG markup string. */
  svg: string;
  /** ISO-8601 timestamp of when this record was last written. */
  updatedAt: string;
}

/** The manifest record stored in the `manifest` object store. */
export interface GfxManifestRecord extends GfxIconsManifest {
  /** Fixed key identifying the single manifest record. */
  id: string;
}