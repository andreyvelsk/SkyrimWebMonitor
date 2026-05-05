import { computed, type ComputedRef } from 'vue';
import tamrielProjection from '../data/tamrielProjection.json';

export interface Point {
  x: number;
  y: number;
}

export interface ProjectedPoint extends Point {
  u: number;
  v: number;
}

export type MapProjectionFn = (point: Point) => ProjectedPoint | null;

interface ProjectionBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  minU: number;
  minV: number;
  maxU: number;
  maxV: number;
}

interface ProjectionData {
  meshName: string;
  imageWidth: number;
  imageHeight: number;
  bounds: ProjectionBounds;
  vertexStride: 4;
  triangleStride: 3;
  vertices: number[];
  triangles: number[];
}

interface TriangleGrid {
  cellWidth: number;
  cellHeight: number;
  buckets: number[][];
}

interface ImageCorrectionMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface UseMapProjection {
  projectWorldToImage: MapProjectionFn;
  imageWidth: number;
  imageHeight: number;
  meshName: string;
  bounds: ProjectionBounds;
  isReady: ComputedRef<boolean>;
}

const projectionData = tamrielProjection as ProjectionData;
const GRID_SIZE = 128;
const BARYCENTRIC_EPSILON = -1e-6;
export const ENABLE_IMAGE_CORRECTION = true;
const IMAGE_CORRECTION: ImageCorrectionMatrix = {
  "a": 1.0009632654426412,
  "c": 0.0024280042349955015,
  "e": -7.934611523904017,
  "b": -0.001708694270502052,
  "d": 1.010553408600275,
  "f": -37.5297259438135
};
const vertices = Float64Array.from(projectionData.vertices);
const triangles = Uint32Array.from(projectionData.triangles);
const triangleGrid = buildTriangleGrid();

export const FWMF_MAP_IMAGE_WIDTH = projectionData.imageWidth;
export const FWMF_MAP_IMAGE_HEIGHT = projectionData.imageHeight;
export const FWMF_MAP_MESH_NAME = projectionData.meshName;
export const FWMF_MAP_BOUNDS = projectionData.bounds;

export function useMapProjection(): UseMapProjection {
  return {
    projectWorldToImage,
    imageWidth: FWMF_MAP_IMAGE_WIDTH,
    imageHeight: FWMF_MAP_IMAGE_HEIGHT,
    meshName: FWMF_MAP_MESH_NAME,
    bounds: FWMF_MAP_BOUNDS,
    isReady: computed(() => true),
  };
}

export function projectWorldToImage(point: Point): ProjectedPoint | null {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  if (!isInsideBounds(point.x, point.y)) return null;

  const bucket = getBucket(point.x, point.y);
  if (!bucket) return null;

  for (let i = 0; i < bucket.length; i += 1) {
    const triangleOffset = bucket[i];
    const ia = triangles[triangleOffset] * projectionData.vertexStride;
    const ib = triangles[triangleOffset + 1] * projectionData.vertexStride;
    const ic = triangles[triangleOffset + 2] * projectionData.vertexStride;
    const weights = getBarycentricWeights(point.x, point.y, ia, ib, ic);

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
    const corrected = ENABLE_IMAGE_CORRECTION ? applyImageCorrection(rawPoint) : rawPoint;

    return {
      x: corrected.x,
      y: corrected.y,
      u,
      v,
    };
  }

  return null;
}

function applyImageCorrection(point: Point): Point {
  return {
    x: IMAGE_CORRECTION.a * point.x + IMAGE_CORRECTION.c * point.y + IMAGE_CORRECTION.e,
    y: IMAGE_CORRECTION.b * point.x + IMAGE_CORRECTION.d * point.y + IMAGE_CORRECTION.f,
  };
}

function buildTriangleGrid(): TriangleGrid {
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

function getBucket(x: number, y: number): number[] | null {
  const { bounds } = projectionData;
  const gridX = getGridIndex(x, bounds.minX, triangleGrid.cellWidth);
  const gridY = getGridIndex(y, bounds.minY, triangleGrid.cellHeight);
  return triangleGrid.buckets[gridY * GRID_SIZE + gridX] ?? null;
}

function getGridIndex(value: number, min: number, cellSize: number): number {
  const index = Math.floor((value - min) / cellSize);
  return clamp(index, 0, GRID_SIZE - 1);
}

function isInsideBounds(x: number, y: number): boolean {
  const { bounds } = projectionData;
  return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

function getBarycentricWeights(
  x: number,
  y: number,
  ia: number,
  ib: number,
  ic: number
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