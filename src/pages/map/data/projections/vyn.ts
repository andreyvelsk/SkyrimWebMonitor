import type { ProjectionData } from '../../config/types';
import { BASE_PROJECTION } from './constants';

/**
 * Affine correction for the Vyn hand-painted map texture.
 * Computed via least-squares affine fit from 3 calibration points.
 * Compensates for shear between the axis-aligned quad projection
 * and the actual pixel positions on the painted map.
 */
export const VYN_IMAGE_CORRECTION = {
  a: 0.9953549124,
  c: 0.0088225054,
  e: -9.7832135198,
  b: -0.0099008168,
  d: 1.0186388359,
  f: -20.4787656934,
};

/**
 * FWMF-проекция карты Вин (материк Винтерсанд / Beyond Skyrim).
 *
 * Размер текстуры: 4096×4096.
 * Координаты игрового мира: ~ ±164k единиц.
 *
 * Формат vertices: [x, y, u, v] для 4 вершин quad-меша:
 *   (maxX, maxY, maxU, minV)  — top-right
 *   (minX, maxY, minU, minV)  — top-left
 *   (minX, minY, minU, maxV)  — bottom-left
 *   (maxX, minY, maxU, maxV)  — bottom-right
 */

const X_MIN = -217428.857165;
const Y_MIN = -168727.484831;
const X_MAX = 159467.517355;
const Y_MAX = 216352.461683;
const U_MIN = 0.0;
const V_MIN = 0.0;
const U_MAX = 1.0;
const V_MAX = 1.0;

export const vynProjection: ProjectionData = {
  ...BASE_PROJECTION,
  imageWidth: 4096,
  imageHeight: 4096,
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
