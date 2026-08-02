# Projection Calibration for a New Map

## Overview

When there is no BTR file with an FWMF mesh (or the mesh consists of many files), the projection can be computed via **reference point calibration**. The method fits quad projection parameters (`minX`, `maxX`, `minY`, `maxY`) directly, minimizing error across all points, and computes the residual `imageCorrection` matrix.

## Required Data

1. **Image dimensions** of the map in pixels (`imageWidth` × `imageHeight`)
2. **At least 3 reference points** (5–9 recommended for better accuracy). Each point is a pair:
   - **Game coordinates** `(gameX, gameY)` — from server data (hotspots) or the game console (`player.getpos x/y`)
   - **Pixel coordinates** `(imageX, imageY)` — click on a location on the map in the app; coordinates are printed to the browser console: `[map] image px: { x: ..., y: ... }`

   **Important**: points should be evenly distributed across the map (center + 4 corners/edges). Points only in the center will give poor extrapolation to the edges.

## Steps

### 1. Collect reference points

Launch the app, open the desired map. For each known location:
- Record its game coordinates (from server data — `x`, `y` fields in hotspots)
- Click on it on the map — the console will show `[map] image px: { x: ..., y: ... }`
- Record the pair: `gameX, gameY → imageX, imageY`

### 2. Run the calibration script

```bash
python scripts/calibrate-map-projection.py \
  --image-width 4096 \
  --image-height 4096 \
  --points calibration_points.json \
  --output-vyn src/pages/map/data/projections/vyn.ts \
  --output-registry src/pages/map/config/mapRegistry.ts \
  --worldspace Vyn
```

Format of `calibration_points.json`:

```json
[
  { "gameX": -19297.37, "gameY": 34.45, "imageX": 2153.75, "imageY": 2302.01 },
  { "gameX": -110437.21, "gameY": 57360.35, "imageX": 1162.49, "imageY": 1690.69 },
  { "gameX": 76705.88, "gameY": -43453.27, "imageX": 3196.32, "imageY": 2762.87 }
]
```

### 3. Verify the result

The script will output:
- Computed bounds (`X_MIN`, `X_MAX`, `Y_MIN`, `Y_MAX`)
- `imageCorrection` matrix
- Error at each point (should be < 1 pixel)

If the error at any point is > 2–3 pixels — add more points in problem areas and re-run.

## How the Method Works (Math)

### Quad Projection

The 4 mesh vertices define a mapping from the game rectangle to the texture rectangle:

```
X_MAX, Y_MAX, U_MAX(1), V_MIN(0)  — top-right
X_MIN, Y_MAX, U_MIN(0), V_MIN(0)  — top-left
X_MIN, Y_MIN, U_MIN(0), V_MAX(1)  — bottom-left
X_MAX, Y_MIN, U_MAX(1), V_MAX(1)  — bottom-right
```

Barycentric interpolation inside the quad reduces to linear:

```
rawX = (gameX - minX) / (maxX - minX) * imageWidth
rawY = (maxY - gameY) / (maxY - minY) * imageHeight
```

### Bounds Fitting (Least Squares)

Rewrite the projection as a linear function:

```
rawX = sx * gameX + ox,   where sx = IW / (maxX - minX),  ox = -minX * sx
rawY = sy * gameY + oy,   where sy = -IH / (maxY - minY), oy = maxY * IH / (maxY - minY)
```

For each axis, solve linear regression `(gameCoord) → (imageCoord)`:

```
sx = (n*Σ(gx*ix) - Σgx*Σix) / (n*Σ(gx²) - (Σgx)²)
ox = (Σix - sx*Σgx) / n
```

Recover bounds from `sx, ox`:

```
maxX - minX = IW / sx
minX = -ox / sx
maxX = minX + (maxX - minX)

maxY - minY = -IH / sy
maxY = -oy / sy
minY = maxY - (maxY - minY)
```

### Residual imageCorrection

After bounds fitting, the error at points is < 1–2 px. The residual affine matrix eliminates it:

```
correctedX = a*rawX + c*rawY + e
correctedY = b*rawX + d*rawY + f
```

Computed via least squares on pairs `(rawX, rawY) → (imageX, imageY)`.

## Comparison with BTR Method

| | BTR (Tamriel) | Calibration (Vyn) |
|---|---|---|
| Bounds source | FWMF mesh from .btr | Fitting via reference points |
| Accuracy | Absolute (mesh from game) | ~1 px with 5+ points |
| Requires .btr | Yes (single file) | No |
| imageCorrection | Compensates for artist distortion | Compensates for ~1 px residual |