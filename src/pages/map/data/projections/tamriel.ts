import type { ProjectionData } from '../../config/types';
import { BASE_PROJECTION } from './constants';

/**
 * Affine correction for the Tamriel hand-painted map texture.
 * Compensates for slight artistic distortion between the FWMF mesh UVs
 * and the actual pixel positions on the painted map.
 */
export const TAMRIEL_IMAGE_CORRECTION = {
  a: 1.0009632654426412,
  c: 0.0024280042349955015,
  e: -7.934611523904017,
  b: -0.001708694270502052,
  d: 1.010553408600275,
  f: -37.5297259438135,
};

/**
 * FWMF projection for the Tamriel map (Skyrim continent).
 *
 * Texture size: 16384×16384.
 * World-space coordinates: ~ ±267k units.
 *
 * Vertex format: [x, y, u, v] for 4 vertices of a quad mesh:
 *   (maxX, maxY, maxU, minV)  — top-right
 *   (minX, maxY, minU, minV)  — top-left
 *   (minX, minY, minU, maxV)  — bottom-left
 *   (maxX, minY, maxU, maxV)  — bottom-right
 */

const X_MIN = -254800.00400543213;
const Y_MIN = -266800.0040054321;
const X_MAX = 266800.0040054321;
const Y_MAX = 254800.00400543213;
const U_MIN = 0.0;
const V_MIN = 0.0;
const U_MAX = 1.0;
const V_MAX = 1.0;

export const tamrielProjection: ProjectionData = {
  ...BASE_PROJECTION,
  imageWidth: 8192,
  imageHeight: 8192,
  bounds: {
    minX: X_MIN,
    minY: Y_MIN,
    maxX: X_MAX,
    maxY: Y_MAX,
    minU: U_MIN,
    minV: V_MIN,
    maxU: U_MAX,
    maxV: V_MAX,
  },
  vertices: [
    X_MAX, Y_MAX, U_MAX, V_MIN,
    X_MIN, Y_MAX, U_MIN, V_MIN,
    X_MIN, Y_MIN, U_MIN, V_MAX,
    X_MAX, Y_MIN, U_MAX, V_MAX,
  ],
};
