import { computed, type ComputedRef } from 'vue';
import type { MapConfig, ProjectionData, ImageCorrectionMatrix } from '../config/types';

export interface Point {
  x: number;
  y: number;
}

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

// =============================================================
// Internal state (per-instance, set by createMapProjection)
// =============================================================

const GRID_SIZE = 128;
const BARYCENTRIC_EPSILON = -1e-6;

interface TriangleGrid {
  cellWidth: number;
  cellHeight: number;
  buckets: number[][];
}

/**
 * Create a self-contained map projection engine from a MapConfig.
 *
 * All state (vertices, triangles, grid, correction matrix) is captured
 * at creation time — no global mutable state. Call this once per map
 * and pass the returned `projectWorldToImage` to markers / player overlay.
 */
export function createMapProjection(config: MapConfig): UseMapProjection {
  const projectionData = config.projectionData;
  const imageCorrection: ImageCorrectionMatrix | undefined = config.imageCorrection;

  const vertices = Float64Array.from(projectionData.vertices);
  const triangles = Uint32Array.from(projectionData.triangles);
  const triangleGrid = buildTriangleGrid(projectionData, vertices, triangles);

  function projectWorldToImage(point: Point): ProjectedPoint | null {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
    if (!isInsideBounds(point.x, point.y, projectionData.bounds)) return null;

    const bucket = getBucket(point.x, point.y, projectionData.bounds, triangleGrid);
    if (!bucket) return null;

    for (let i = 0; i < bucket.length; i += 1) {
      const triangleOffset = bucket[i];
      const ia = triangles[triangleOffset] * projectionData.vertexStride;
      const ib = triangles[triangleOffset + 1] * projectionData.vertexStride;
      const ic = triangles[triangleOffset + 2] * projectionData.vertexStride;
      const weights = getBarycentricWeights(point.x, point.y, ia, ib, ic, vertices);

      if (!weights) continue;

      const u =
        weights.a * vertices[ia + 2] +
        weights.b * vertices[ib + 2] +
        weights.c * vertices[ic + 2];
      const v =
        weights.a * vertices[ia + 3] +
        weights.b * vertices[ib + 3] +
        weights.c * vertices[ic + 3];

      const rawPoint = {
        x: u * projectionData.imageWidth,
        y: v * projectionData.imageHeight,
      };
      const corrected = imageCorrection ? applyImageCorrection(rawPoint, imageCorrection) : rawPoint;

      return {
        x: corrected.x,
        y: corrected.y,
        u,
        v,
      };
    }

    return null;
  }

  return {
    projectWorldToImage,
    imageWidth: projectionData.imageWidth,
    imageHeight: projectionData.imageHeight,
    meshName: projectionData.meshName,
    bounds: projectionData.bounds,
    isReady: computed(() => true),
  };
}

// =============================================================
// Vue composable — thin wrapper for reactive usage in components
// =============================================================

/**
 * Vue composable that creates (or reuses) a projection engine for the
 * given MapConfig. In a typical SPA the config is stable per map, so
 * the engine is created once and held by the component's setup scope.
 */
export function useMapProjection(config: MapConfig): UseMapProjection {
  return createMapProjection(config);
}

// =============================================================
// Pure helpers (no global state)
// =============================================================

function applyImageCorrection(point: Point, m: ImageCorrectionMatrix): Point {
  return {
    x: m.a * point.x + m.c * point.y + m.e,
    y: m.b * point.x + m.d * point.y + m.f,
  };
}

function buildTriangleGrid(
  projectionData: ProjectionData,
  vertices: Float64Array,
  triangles: Uint32Array,
): TriangleGrid {
  const { bounds } = projectionData;
  const cellWidth = (bounds.maxX - bounds.minX) / GRID_SIZE;
  const cellHeight = (bounds.maxY - bounds.minY) / GRID_SIZE;
  const buckets = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => [] as number[]);

  for (let triangleOffset = 0; triangleOffset < triangles.length; triangleOffset += 3) {
    const ia = triangles[triangleOffset] * projectionData.vertexStride;
    const ib = triangles[triangleOffset + 1] * projectionData.vertexStride;
    const ic = triangles[triangleOffset + 2] * projectionData.vertexStride;
    const minX = Math.min(vertices[ia], vertices[ib], vertices[ic]);
    const maxX = Math.max(vertices[ia], vertices[ib], vertices[ic]);
    const minY = Math.min(vertices[ia + 1], vertices[ib + 1], vertices[ic + 1]);
    const maxY = Math.max(vertices[ia + 1], vertices[ib + 1], vertices[ic + 1]);
    const startX = getGridIndex(minX, bounds.minX, cellWidth);
    const endX = getGridIndex(maxX, bounds.minX, cellWidth);
    const startY = getGridIndex(minY, bounds.minY, cellHeight);
    const endY = getGridIndex(maxY, bounds.minY, cellHeight);

    for (let gridY = startY; gridY <= endY; gridY += 1) {
      for (let gridX = startX; gridX <= endX; gridX += 1) {
        buckets[gridY * GRID_SIZE + gridX].push(triangleOffset);
      }
    }
  }

  return { cellWidth, cellHeight, buckets };
}

function getBucket(
  x: number,
  y: number,
  bounds: ProjectionData['bounds'],
  grid: TriangleGrid,
): number[] | null {
  const gridX = getGridIndex(x, bounds.minX, grid.cellWidth);
  const gridY = getGridIndex(y, bounds.minY, grid.cellHeight);
  return grid.buckets[gridY * GRID_SIZE + gridX] ?? null;
}

function getGridIndex(value: number, min: number, cellSize: number): number {
  const index = Math.floor((value - min) / cellSize);
  return clamp(index, 0, GRID_SIZE - 1);
}

function isInsideBounds(x: number, y: number, bounds: ProjectionData['bounds']): boolean {
  return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

function getBarycentricWeights(
  x: number,
  y: number,
  ia: number,
  ib: number,
  ic: number,
  vertices: Float64Array,
): { a: number; b: number; c: number } | null {
  const ax = vertices[ia];
  const ay = vertices[ia + 1];
  const bx = vertices[ib];
  const by = vertices[ib + 1];
  const cx = vertices[ic];
  const cy = vertices[ic + 1];
  const denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);

  if (Math.abs(denominator) < 1e-9) return null;

  const a = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / denominator;
  const b = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / denominator;
  const c = 1 - a - b;

  if (a < BARYCENTRIC_EPSILON || b < BARYCENTRIC_EPSILON || c < BARYCENTRIC_EPSILON) {
    return null;
  }

  return { a, b, c };
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

// =============================================================
// Backward-compatible re-exports (deprecated — use MapConfig)
// =============================================================

export {
  /** @deprecated Import from `mapRegistry` instead. */
  type ProjectionData,
  /** @deprecated Import from `mapRegistry` instead. */
  type ImageCorrectionMatrix,
};