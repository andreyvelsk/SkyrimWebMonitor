#!/usr/bin/env python3
"""
Calibrate a map projection from reference points.

Fits an axis-aligned quad projection (minX, maxX, minY, maxY) directly
to calibration points using least-squares linear regression, then computes
a residual imageCorrection affine matrix to eliminate the remaining ~1 px error.

Usage:
  python scripts/calibrate-map-projection.py \
    --image-width 4096 \
    --image-height 4096 \
    --points calibration_points.json \
    --output-projection src/pages/map/data/projections/vyn.ts \
    --worldspace Vyn

Input JSON format (array of {gameX, gameY, imageX, imageY}):
  [
    { "gameX": -19297.37, "gameY": 34.45, "imageX": 2153.75, "imageY": 2302.01 },
    { "gameX": -110437.21, "gameY": 57360.35, "imageX": 1162.49, "imageY": 1690.69 },
    { "gameX": 76705.88, "gameY": -43453.27, "imageX": 3196.32, "imageY": 2762.87 }
  ]

At least 3 points are required. 5–9 points evenly distributed across the map
(centre + corners/edges) give the best results.
"""

import argparse
import json
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Least-squares linear regression: y = slope * x + intercept
# ---------------------------------------------------------------------------

def linear_fit(xs, ys):
    """Return (slope, intercept) for y = slope*x + intercept."""
    n = len(xs)
    if n < 2:
        raise ValueError('Need at least 2 points for linear fit')

    sum_x = sum(xs)
    sum_y = sum(ys)
    sum_xy = sum(x * y for x, y in zip(xs, ys))
    sum_x2 = sum(x * x for x in xs)

    denom = n * sum_x2 - sum_x * sum_x
    if abs(denom) < 1e-15:
        raise ValueError('Degenerate points — all gameX or gameY are identical')

    slope = (n * sum_xy - sum_x * sum_y) / denom
    intercept = (sum_y - slope * sum_x) / n
    return slope, intercept


# ---------------------------------------------------------------------------
# 3×3 solver (Cramer's rule) for imageCorrection least squares
# ---------------------------------------------------------------------------

def solve3x3(m, v):
    """Solve 3x3 linear system m * x = v using Cramer's rule."""
    def det(mat):
        return (mat[0][0] * (mat[1][1] * mat[2][2] - mat[1][2] * mat[2][1])
                - mat[0][1] * (mat[1][0] * mat[2][2] - mat[1][2] * mat[2][0])
                + mat[0][2] * (mat[1][0] * mat[2][1] - mat[1][1] * mat[2][0]))

    d = det(m)
    if abs(d) < 1e-15:
        return None

    def col_det(col_idx, col_vals):
        mm = [row[:] for row in m]
        for i in range(3):
            mm[i][col_idx] = col_vals[i]
        return det(mm)

    return [col_det(i, v) / d for i in range(3)]


# ---------------------------------------------------------------------------
# Core calibration
# ---------------------------------------------------------------------------

def calibrate(points, image_width, image_height):
    """
    Compute (minX, maxX, minY, maxY) and imageCorrection {a,b,c,d,e,f}.

    Parameters
    ----------
    points : list of dicts with keys gameX, gameY, imageX, imageY
    image_width, image_height : int
        Natural dimensions of the map image in pixels.

    Returns
    -------
    dict with keys:
        minX, maxX, minY, maxY, imageWidth, imageHeight,
        imageCorrection: {a, c, e, b, d, f} or None,
        errors: list of {gameX, gameY, rawX, rawY, correctedX, correctedY,
                         expectedX, expectedY, errRawX, errRawY, errCorrX, errCorrY}
    """
    n = len(points)
    if n < 3:
        raise ValueError(f'Need at least 3 points, got {n}')

    gx = [p['gameX'] for p in points]
    gy = [p['gameY'] for p in points]
    ix = [p['imageX'] for p in points]
    iy = [p['imageY'] for p in points]

    # --- Fit X axis: imageX = sx * gameX + ox ---
    sx, ox = linear_fit(gx, ix)

    if abs(sx) < 1e-15:
        raise ValueError('X-scale is zero — check calibration points')

    maxX_minus_minX = image_width / sx
    minX = -ox / sx
    maxX = minX + maxX_minus_minX

    # --- Fit Y axis: imageY = sy * gameY + oy ---
    # Quad projection: rawY = IH * (maxY - gameY) / (maxY - minY)
    #                  = -IH/(maxY-minY) * gameY + IH*maxY/(maxY-minY)
    # So: sy = -IH/(maxY-minY), oy = IH*maxY/(maxY-minY)
    sy, oy = linear_fit(gy, iy)

    if abs(sy) < 1e-15:
        raise ValueError('Y-scale is zero — check calibration points')

    maxY_minus_minY = -image_height / sy
    maxY = -oy / sy
    minY = maxY - maxY_minus_minY

    # --- Compute raw projections ---
    raw = []
    for p in points:
        rx = (p['gameX'] - minX) / (maxX - minX) * image_width
        ry = (maxY - p['gameY']) / (maxY - minY) * image_height
        raw.append((rx, ry))

    # --- Fit residual imageCorrection ---
    # correctedX = a*rawX + c*rawY + e
    # correctedY = b*rawX + d*rawY + f
    srx = sum(r[0] for r in raw)
    sry = sum(r[1] for r in raw)
    srx2 = sum(r[0] * r[0] for r in raw)
    sry2 = sum(r[1] * r[1] for r in raw)
    srxry = sum(r[0] * r[1] for r in raw)
    srxix = sum(r[0] * p['imageX'] for r, p in zip(raw, points))
    sryix = sum(r[1] * p['imageX'] for r, p in zip(raw, points))
    six = sum(p['imageX'] for p in points)
    srxiy = sum(r[0] * p['imageY'] for r, p in zip(raw, points))
    sryiy = sum(r[1] * p['imageY'] for r, p in zip(raw, points))
    siy = sum(p['imageY'] for p in points)

    N = [[srx2, srxry, srx],
         [srxry, sry2, sry],
         [srx, sry, n]]

    ic_x = solve3x3(N, [srxix, sryix, six])
    ic_y = solve3x3(N, [srxiy, sryiy, siy])

    image_correction = None
    if ic_x and ic_y:
        # Only include if it's not near-identity (has meaningful effect)
        image_correction = {
            'a': ic_x[0], 'c': ic_x[1], 'e': ic_x[2],
            'b': ic_y[0], 'd': ic_y[1], 'f': ic_y[2],
        }

    # --- Compute errors ---
    errors = []
    for p, (rx, ry) in zip(points, raw):
        cx = rx if image_correction is None else (
            image_correction['a'] * rx +
            image_correction['c'] * ry +
            image_correction['e']
        )
        cy = ry if image_correction is None else (
            image_correction['b'] * rx +
            image_correction['d'] * ry +
            image_correction['f']
        )
        errors.append({
            'gameX': p['gameX'],
            'gameY': p['gameY'],
            'rawX': rx,
            'rawY': ry,
            'correctedX': cx,
            'correctedY': cy,
            'expectedX': p['imageX'],
            'expectedY': p['imageY'],
            'errRawX': rx - p['imageX'],
            'errRawY': ry - p['imageY'],
            'errCorrX': cx - p['imageX'],
            'errCorrY': cy - p['imageY'],
        })

    return {
        'minX': minX,
        'maxX': maxX,
        'minY': minY,
        'maxY': maxY,
        'imageWidth': image_width,
        'imageHeight': image_height,
        'imageCorrection': image_correction,
        'errors': errors,
    }


# ---------------------------------------------------------------------------
# Output generators
# ---------------------------------------------------------------------------

def generate_projection_ts(result, worldspace_name):
    """Generate the content of a projection .ts file."""
    ic = result['imageCorrection']
    has_ic = ic is not None

    lines = []
    lines.append("import type { ProjectionData } from '../../config/types';")
    lines.append("import { BASE_PROJECTION } from './constants';")
    lines.append('')
    lines.append('/**')
    lines.append(f' * FWMF-проекция карты {worldspace_name}.')
    lines.append(' *')
    lines.append(f' * Размер текстуры: {result["imageWidth"]}×{result["imageHeight"]}.')
    lines.append(' * Границы вычислены калибровкой по опорным точкам')
    lines.append(' * (метод наименьших квадратов, квад-проекция).')
    lines.append(' *')
    lines.append(' * Формат vertices: [x, y, u, v] для 4 вершин quad-меша:')
    lines.append(' *   (maxX, maxY, maxU, minV)  — top-right')
    lines.append(' *   (minX, maxY, minU, minV)  — top-left')
    lines.append(' *   (minX, minY, minU, maxV)  — bottom-left')
    lines.append(' *   (maxX, minY, maxU, maxV)  — bottom-right')
    lines.append(' */')
    lines.append('')
    lines.append(f'const X_MIN = {result["minX"]:.6f};')
    lines.append(f'const Y_MIN = {result["minY"]:.6f};')
    lines.append(f'const X_MAX = {result["maxX"]:.6f};')
    lines.append(f'const Y_MAX = {result["maxY"]:.6f};')
    lines.append('const U_MIN = 0.0;')
    lines.append('const V_MIN = 0.0;')
    lines.append('const U_MAX = 1.0;')
    lines.append('const V_MAX = 1.0;')
    lines.append('')
    lines.append('export const vynProjection: ProjectionData = {')
    lines.append('  ...BASE_PROJECTION,')
    lines.append(f'  imageWidth: {result["imageWidth"]},')
    lines.append(f'  imageHeight: {result["imageHeight"]},')
    lines.append('  bounds: {')
    lines.append('    minX: X_MIN,')
    lines.append('    minY: Y_MIN,')
    lines.append('    maxX: X_MAX,')
    lines.append('    maxY: Y_MAX,')
    lines.append('    minU: U_MIN,')
    lines.append('    minV: V_MIN,')
    lines.append('    maxU: U_MAX,')
    lines.append('    maxV: V_MAX,')
    lines.append('  },')
    lines.append('  vertices: [')
    lines.append('    X_MAX, Y_MAX, U_MAX, V_MIN,')
    lines.append('    X_MIN, Y_MAX, U_MIN, V_MIN,')
    lines.append('    X_MIN, Y_MIN, U_MIN, V_MAX,')
    lines.append('    X_MAX, Y_MIN, U_MAX, V_MAX,')
    lines.append('  ],')
    lines.append('};')
    lines.append('')
    return '\n'.join(lines)


def generate_image_correction_ts(ic, var_name):
    """Generate TypeScript imageCorrection constant."""
    if ic is None:
        return None
    lines = []
    lines.append('/**')
    lines.append(' * Affine correction computed via least-squares fit')
    lines.append(' * from calibration points. Compensates for residual')
    lines.append(' * shear between the axis-aligned quad projection')
    lines.append(' * and the actual pixel positions on the map.')
    lines.append(' */')
    lines.append(f'const {var_name} = {{')
    lines.append(f'  a: {ic["a"]:.10f},')
    lines.append(f'  c: {ic["c"]:.10f},')
    lines.append(f'  e: {ic["e"]:.10f},')
    lines.append(f'  b: {ic["b"]:.10f},')
    lines.append(f'  d: {ic["d"]:.10f},')
    lines.append(f'  f: {ic["f"]:.10f},')
    lines.append('};')
    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Calibrate a map projection from reference points.'
    )
    parser.add_argument(
        '--image-width', type=int, required=True,
        help='Natural image width in pixels (e.g. 4096).'
    )
    parser.add_argument(
        '--image-height', type=int, required=True,
        help='Natural image height in pixels (e.g. 4096).'
    )
    parser.add_argument(
        '--points', type=Path, required=True,
        help='Path to JSON file with calibration points.'
    )
    parser.add_argument(
        '--output-projection', type=Path, default=None,
        help='Write projection .ts file (e.g. src/pages/map/data/projections/vyn.ts).'
    )
    parser.add_argument(
        '--worldspace', type=str, default='NewWorld',
        help='Worldspace name for the generated comment (default: NewWorld).'
    )
    parser.add_argument(
        '--print-correction', action='store_true',
        help='Print imageCorrection block for mapRegistry.ts to stdout.'
    )
    parser.add_argument(
        '--correction-var-name', type=str, default='NEW_MAP_IMAGE_CORRECTION',
        help='Variable name for the imageCorrection constant.'
    )
    args = parser.parse_args()

    # Load points
    try:
        with args.points.open('r', encoding='utf-8') as f:
            points_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f'Error reading {args.points}: {e}', file=sys.stderr)
        sys.exit(1)

    if not isinstance(points_data, list):
        print('Error: --points JSON must be an array', file=sys.stderr)
        sys.exit(1)

    # Validate and convert
    points = []
    for i, pt in enumerate(points_data):
        for key in ('gameX', 'gameY', 'imageX', 'imageY'):
            if key not in pt:
                print(f'Error: point {i} missing key "{key}"', file=sys.stderr)
                sys.exit(1)
        points.append({
            'gameX': float(pt['gameX']),
            'gameY': float(pt['gameY']),
            'imageX': float(pt['imageX']),
            'imageY': float(pt['imageY']),
        })

    # Run calibration
    try:
        result = calibrate(points, args.image_width, args.image_height)
    except ValueError as e:
        print(f'Calibration failed: {e}', file=sys.stderr)
        sys.exit(1)

    # --- Print report ---
    world_w = result['maxX'] - result['minX']
    world_h = result['maxY'] - result['minY']

    print('=' * 60)
    print('CALIBRATION RESULTS')
    print('=' * 60)
    print(f'Worldspace:        {args.worldspace}')
    print(f'Image size:        {result["imageWidth"]} × {result["imageHeight"]} px')
    print(f'World size:        {world_w:.1f} × {world_h:.1f} game units')
    print(f'Aspect ratio:      {world_w / world_h:.4f}  (image: {result["imageWidth"] / result["imageHeight"]:.4f})')
    print()
    print('Bounds:')
    print(f'  X_MIN = {result["minX"]:.6f}')
    print(f'  X_MAX = {result["maxX"]:.6f}')
    print(f'  Y_MIN = {result["minY"]:.6f}')
    print(f'  Y_MAX = {result["maxY"]:.6f}')
    print()

    # Errors
    print(f'{"Point":<6} {"gameX":>12} {"gameY":>12} {"rawErrX":>9} {"rawErrY":>9} {"corrErrX":>9} {"corrErrY":>9}')
    print('-' * 72)
    max_raw_err = 0.0
    for i, err in enumerate(result['errors']):
        max_raw_err = max(max_raw_err, abs(err['errRawX']), abs(err['errRawY']))
        print(
            f'{i:<6} '
            f'{err["gameX"]:>12.1f} '
            f'{err["gameY"]:>12.1f} '
            f'{err["errRawX"]:>9.2f} '
            f'{err["errRawY"]:>9.2f} '
            f'{err["errCorrX"]:>9.4f} '
            f'{err["errCorrY"]:>9.4f}'
        )
    print()
    print(f'Max raw error:     {max_raw_err:.2f} px')
    if result['imageCorrection']:
        ic = result['imageCorrection']
        print()
        print('ImageCorrection matrix:')
        print(f'  a={ic["a"]:.10f}  c={ic["c"]:.10f}  e={ic["e"]:.10f}')
        print(f'  b={ic["b"]:.10f}  d={ic["d"]:.10f}  f={ic["f"]:.10f}')
    print('=' * 60)

    # --- Write projection file ---
    if args.output_projection:
        ts_content = generate_projection_ts(result, args.worldspace)
        args.output_projection.parent.mkdir(parents=True, exist_ok=True)
        args.output_projection.write_text(ts_content, encoding='utf-8')
        print(f'\nProjection written to: {args.output_projection}')

    # --- Print imageCorrection block ---
    if args.print_correction and result['imageCorrection']:
        print()
        print('--- imageCorrection for mapRegistry.ts ---')
        print(generate_image_correction_ts(result['imageCorrection'], args.correction_var_name))


if __name__ == '__main__':
    main()