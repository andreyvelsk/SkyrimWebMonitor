import type { ProjectionData } from '../../config/types';

/**
 * Common constants for FWMF map projections.
 * These values are identical for all maps using the FWMF format
 * (Tamriel, Vyn, etc.) and are extracted here to eliminate duplication.
 */

/** BTR file source (relative path inside FWMF archive). */
export const PROJECTION_SOURCE = 'tamriel/tamriel.32.0.0.btr';

/** Mesh name in the BTR file containing projection data. */
export const PROJECTION_MESH_NAME = 'chunk:6';

/** Data block index inside the mesh. */
export const PROJECTION_BLOCK_INDEX = 5;

/** Map texture paths. */
export const PROJECTION_TEXTURE_PATHS: string[] = ['textures\\terrain\\tamriel\\skyrim.dds'];

/** Number of values describing a single vertex (x, y, u, v). */
export const PROJECTION_VERTEX_STRIDE = 4 as const;

/** Number of indices per triangle. */
export const PROJECTION_TRIANGLE_STRIDE = 3 as const;

/**
 * Triangle indices for a rectangular mesh made of two triangles.
 * Order: 0-1-2 and 0-2-3 (standard quad split diagonally).
 */
export const PROJECTION_TRIANGLES: [number, number, number, number, number, number] = [0, 1, 2, 0, 2, 3];

/**
 * Base projection fields common to all FWMF maps.
 * Used as a foundation for building specific projections.
 */
export const BASE_PROJECTION: Pick<
  ProjectionData,
  'source' | 'meshName' | 'blockIndex' | 'texturePaths' | 'vertexStride' | 'triangleStride' | 'triangles'
> = {
  source: PROJECTION_SOURCE,
  meshName: PROJECTION_MESH_NAME,
  blockIndex: PROJECTION_BLOCK_INDEX,
  texturePaths: PROJECTION_TEXTURE_PATHS,
  vertexStride: PROJECTION_VERTEX_STRIDE,
  triangleStride: PROJECTION_TRIANGLE_STRIDE,
  triangles: PROJECTION_TRIANGLES,
};
