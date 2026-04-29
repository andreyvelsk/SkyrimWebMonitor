import { computed, type ComputedRef } from 'vue';

// =============================================================
// Map ↔ game coordinate system
// =============================================================
//
// IMPORTANT — direction of the transform:
//   We adapt the MAP coordinate system to the GAME coordinate system, NOT the
//   other way around. The player's position is delivered by the game many
//   times per second; we MUST NOT convert it on every update.
//
// How calibration works:
//   The Skyrim world map is hand-painted, so the relationship between game
//   coordinates and image pixels is NOT a perfect affine transform — there
//   is slight artistic distortion. A 3-point exact affine fits the 3 chosen
//   points but extrapolates poorly elsewhere. Instead we use a LEAST-SQUARES
//   affine fit over an arbitrary number of reference points (N ≥ 3); the
//   error is spread evenly across all of them.
//
// Recommended number of reference points:
//   3   — minimum. Exact fit at those 3, error grows with distance.
//   5–6 — good balance. One per corner of the map plus center.
//   9   — ideal for Skyrim: one per Hold capital. Even geographic coverage
//         and natural choice of well-known landmarks. Adding more past ~10
//         brings diminishing returns.
//
// To recalibrate: tap each landmark on the map (the click handler in
// TheMap.vue prints image-pixel coords to the console) and update the
// `imagePx` field of the corresponding entry in REFERENCE_POINTS. To add a
// new landmark, push another entry — no other code changes are needed.
// =============================================================

export interface Point {
  x: number;
  y: number;
}

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

// -----------------------------------------------------------------
// Reference landmarks
//
// Game coordinates come from the engine and are constants. Image pixel
// coordinates are filled in by clicking on each landmark in TheMap.vue —
// the click handler prints `[map] image px: { x: ..., y: ... }` to the
// console. Replace NOT_CALIBRATED with that object literal.
// -----------------------------------------------------------------

export const WHITERUN_GAME: Point = { x: 19855.2265625, y: -7422.51025390625 };
export const SOLITUDE_GAME: Point = { x: -64942.99609375, y: 104648.0 };
export const RIFTEN_GAME: Point = { x: 173415.203125, y: -96600.1484375 };
export const MARKARTH_GAME: Point = { x: -174024.296875, y: 5255.478515625 };
export const WINDHELM_GAME: Point = { x: 135025.78125, y: 35596.5859375 };
export const FALKREATH_GAME: Point = { x: -30296.33203125, y: -86283.8984375 };
export const MORTHAL_GAME: Point = { x: -38639.7421875, y: 66734.296875 };
export const DAWNSTAR_GAME: Point = { x: 30808.154296875, y: 106138.28125 };
export const WINTERHOLD_GAME: Point = { x: 109207.53125, y: 102864.0390625 };

export const WHITERUN_IMAGE_PX: Point = { x: 5190.46, y: 2883.55 };
export const SOLITUDE_IMAGE_PX: Point = { x: 3831.38, y: 1203.09 };
export const RIFTEN_IMAGE_PX: Point = { x: 7497.31, y: 4262.83 };

/**
 * Calibration set. Order is irrelevant. Entries with `game === null` or
 * `imagePx === null` are silently skipped — fill them in to add a landmark
 * to the fit.
 */
export const REFERENCE_POINTS: ReferencePoint[] = [
  { name: 'Whiterun',   game: WHITERUN_GAME,   imagePx: WHITERUN_IMAGE_PX },
  { name: 'Solitude',   game: SOLITUDE_GAME,   imagePx: SOLITUDE_IMAGE_PX },
  { name: 'Riften',     game: RIFTEN_GAME,     imagePx: RIFTEN_IMAGE_PX   },
  { name: 'Markarth',   game: MARKARTH_GAME,   imagePx: { x: 2228.58, y: 2748.90 } },
  { name: 'Windhelm',   game: WINDHELM_GAME,   imagePx: { x: 6882.69, y: 2315.27 } },
  { name: 'Falkreath',  game: FALKREATH_GAME,  imagePx: { x: 4362.94, y: 4147.11 } },
  { name: 'Morthal',    game: MORTHAL_GAME,    imagePx: { x: 4311.21, y: 1867.25 } },
  { name: 'Dawnstar',   game: DAWNSTAR_GAME,   imagePx: { x: 5248.70, y: 1191.39 } },
  { name: 'Winterhold', game: WINTERHOLD_GAME, imagePx: { x: 6458.78, y: 1168.84 } },
];
function solve3x3(
  M: readonly [readonly number[], readonly number[], readonly number[]],
  v: readonly number[]
): [number, number, number] | null {
  const [m0, m1, m2] = M;
  const det =
    m0[0] * (m1[1] * m2[2] - m1[2] * m2[1]) -
    m0[1] * (m1[0] * m2[2] - m1[2] * m2[0]) +
    m0[2] * (m1[0] * m2[1] - m1[1] * m2[0]);
  if (Math.abs(det) < 1e-12) return null;

  // Cramer's: replace each column with v in turn.
  const detX =
    v[0]  * (m1[1] * m2[2] - m1[2] * m2[1]) -
    m0[1] * (v[1]  * m2[2] - m1[2] * v[2] ) +
    m0[2] * (v[1]  * m2[1] - m1[1] * v[2] );
  const detY =
    m0[0] * (v[1]  * m2[2] - m1[2] * v[2] ) -
    v[0]  * (m1[0] * m2[2] - m1[2] * m2[0]) +
    m0[2] * (m1[0] * v[2]  - v[1]  * m2[0]);
  const detZ =
    m0[0] * (m1[1] * v[2]  - v[1]  * m2[1]) -
    m0[1] * (m1[0] * v[2]  - v[1]  * m2[0]) +
    v[0]  * (m1[0] * m2[1] - m1[1] * m2[0]);

  return [detX / det, detY / det, detZ / det];
}

/**
 * Best-fit affine transform mapping `src[i] → dst[i]` for any N ≥ 3.
 *
 *   dst.x = a*src.x + c*src.y + e
 *   dst.y = b*src.x + d*src.y + f
 *
 * For N = 3 this returns the exact affine. For N > 3 it returns the unique
 * least-squares-optimal affine (minimizes Σ‖dst_i − M(src_i)‖²). The two
 * coordinate axes decouple, so we solve two independent 3×3 normal-equation
 * systems — fast and numerically simple.
 *
 * Returns null if fewer than 3 points are supplied or the configuration is
 * degenerate (collinear).
 */
export function solveAffineLeastSquares(src: Point[], dst: Point[]): AffineMatrix | null {
  const n = src.length;
  if (n < 3 || dst.length !== n) return null;

  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  let sqx = 0, sxqx = 0, syqx = 0;
  let sqy = 0, sxqy = 0, syqy = 0;

  for (let i = 0; i < n; i++) {
    const p = src[i];
    const q = dst[i];
    sx  += p.x;       sy  += p.y;
    sxx += p.x * p.x; sxy += p.x * p.y; syy += p.y * p.y;
    sqx += q.x;       sxqx += p.x * q.x; syqx += p.y * q.x;
    sqy += q.y;       sxqy += p.x * q.y; syqy += p.y * q.y;
  }

  // Normal-equation matrix is the same for both x- and y-coefficient blocks.
  const N = [
    [sxx, sxy, sx],
    [sxy, syy, sy],
    [sx,  sy,  n ],
  ] as const;

  const xCoeffs = solve3x3(N, [sxqx, syqx, sqx]); // → [a, c, e]
  const yCoeffs = solve3x3(N, [sxqy, syqy, sqy]); // → [b, d, f]
  if (!xCoeffs || !yCoeffs) return null;

  return {
    a: xCoeffs[0], c: xCoeffs[1], e: xCoeffs[2],
    b: yCoeffs[0], d: yCoeffs[1], f: yCoeffs[2],
  };
}

/**
 * Backwards-compatible 3-point exact affine. New code should use
 * `solveAffineLeastSquares`, which subsumes this case.
 */
export function solveAffine(
  src: [Point, Point, Point],
  dst: [Point, Point, Point]
): AffineMatrix | null {
  return solveAffineLeastSquares(src, dst);
}

// -----------------------------------------------------------------
// Composable
// -----------------------------------------------------------------

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

function isFinitePoint(p: Point | null): p is Point {
  return p !== null && Number.isFinite(p.x) && Number.isFinite(p.y);
}

export function useMapCoordinates(): UseMapCoordinates {
  const usable = computed(() =>
    REFERENCE_POINTS.filter(
      (r): r is ReferencePoint & { game: Point; imagePx: Point } =>
        isFinitePoint(r.game) && isFinitePoint(r.imagePx)
    )
  );

  const isCalibrated = computed(() => usable.value.length >= 3);
  const calibrationPointCount = computed(() => usable.value.length);

  const matrix = computed<AffineMatrix | null>(() => {
    const points = usable.value;
    if (points.length < 3) return null;
    return solveAffineLeastSquares(
      points.map((r) => r.game),
      points.map((r) => r.imagePx)
    );
  });

  const overlayTransform = computed(() => {
    const m = matrix.value;
    if (!m) return '';
    return `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`;
  });

  return { matrix, overlayTransform, isCalibrated, calibrationPointCount };
}
