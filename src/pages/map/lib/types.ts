import type { ComputedRef, Ref } from 'vue';
import type { MapHotspotType, MapHotspot, MapQuestMarker } from '@/stores/map/lib/types';
import type { ProjectionData } from '@/pages/map/config/lib/types';

// =============================================================
// Common geometry types (shared by useMapProjection & useMapCoordinates)
// =============================================================

export interface Point {
  x: number;
  y: number;
}

// =============================================================
// Projection types (from useMapProjection.ts)
// =============================================================

export interface ProjectedPoint extends Point {
  u: number;
  v: number;
}

export type MapProjectionFn = (point: Point) => ProjectedPoint | null;

export interface UseMapProjection {
  projectWorldToImage: MapProjectionFn;
  imageWidth: number;
  imageHeight: number;
  meshName: string;
  bounds: ProjectionData['bounds'];
  isReady: ComputedRef<boolean>;
}

export interface TriangleGrid {
  cellWidth: number;
  cellHeight: number;
  buckets: number[][];
}

// =============================================================
// Coordinate calibration types (from useMapCoordinates.ts)
// =============================================================

export interface AffineMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface ReferencePoint {
  /** Display name — used for debugging / dev-overlays only. */
  name: string;
  /** Coordinates in game space, or null if unknown. */
  game: Point | null;
  /** Coordinates in NATURAL pixels of map.jpg, or null if not yet calibrated. */
  imagePx: Point | null;
}

export interface UseMapCoordinates {
  /** Affine matrix from game coords to image-pixel coords, or null until calibrated. */
  matrix: ComputedRef<AffineMatrix | null>;
  /**
   * SVG transform attribute string that turns a child group's local
   * coordinate system into raw game coordinates.
   */
  overlayTransform: ComputedRef<string>;
  /** True iff at least 3 reference points are fully calibrated. */
  isCalibrated: ComputedRef<boolean>;
  /** Number of points actually used for the current fit. */
  calibrationPointCount: ComputedRef<number>;
}

// =============================================================
// Projected marker types (from useProjectedMapMarkers.ts)
// =============================================================

export interface UseProjectedMapMarkersOptions {
  projectWorldToImage: MapProjectionFn;
  hotspots: Ref<MapHotspot[]>;
  questMarkers: Ref<MapQuestMarker[]>;
  questIconUrl: string;
  /** Worldspace of the currently active map (e.g. "Tamriel", "DLC2SolstheimWorld"). */
  currentWorldspace: string;
}

// =============================================================
// Map marker display types (from types.ts)
// =============================================================

export interface BaseProjectedMarker {
  key: string;
  refId: string;
  label: string;
  canFastTravel: boolean;
  x: number;
  y: number;
  iconUrl: string;
}

export interface LocationProjectedMarker extends BaseProjectedMarker {
  kind: 'location';
  type: MapHotspotType;
  /** Numeric hotspot typeId from the game, used for per-type marker sizing. */
  typeId: number;
}

export interface QuestProjectedMarker extends BaseProjectedMarker {
  kind: 'quest';
  type: 'QuestObjective';
}

export interface PlayerOverlayPosition {
  x: number;
  y: number;
  angleDeg: number;
}

export type ProjectedMarker = LocationProjectedMarker | QuestProjectedMarker;

// =============================================================
// Tile preloading types (from preloadMap.ts)
// =============================================================

export interface MapTilesManifest {
  width: number;
  height: number;
  tileSize: number;
  cols: number;
  rows: number;
  format: 'webp' | 'jpg' | 'png';
  basePath: string;
}

export interface DziInfo {
  width: number;
  height: number;
  tileSize: number;
  overlap: number;
  format: string;
  /** Base URL of the per-level tile folders (no trailing slash). */
  tilesBase: string;
}

// =============================================================
// Type guards (from types.ts)
// =============================================================

export function isLocationMarker(marker: ProjectedMarker): marker is LocationProjectedMarker {
  return marker.kind === 'location';
}

export function isQuestMarker(marker: ProjectedMarker): marker is QuestProjectedMarker {
  return marker.kind === 'quest';
}