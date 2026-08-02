# Extracting FWMF Projections for Maps

## Overview

Each map in `public/maps/` requires a corresponding projection file in `src/pages/map/data/projections/`. The projection file describes how game coordinates (X, Y worldspace) are transformed into pixel coordinates on the map image.

The projection is extracted from the game's `.btr` files (NIF format), which contain the FWMF mesh — a flat grid linking game coordinates to UV coordinates of the map texture.

## Dependencies

The script requires Python 3 and the `pyffi` library:

```bash
pip install pyffi
```

> **Note:** `pyffi` may require Python ≤ 3.11. For Python 3.12+, use a virtual environment with Python 3.11.

## Usage

```bash
python scripts/extract-fwmf-projection.py \
  --input <path to .btr file> \
  --output src/pages/map/data/projections/<worldspace>.json \
  --texture <texture path fragment> \
  --image-width <PNG map width in pixels> \
  --image-height <PNG map height in pixels>
```

### Parameters

| Parameter | Default | Description |
|---|---|---|
| `--input` | `tamriel/tamriel.32.0.0.btr` | Path to the source BTR file |
| `--output` | `src/pages/map/data/tamrielProjection.json` | Path to save the JSON output |
| `--texture` | `skyrim.dds` | Texture path fragment to find the correct NiTriShape |
| `--shape` | `chunk:16` | NiTriShape name (used only if `--texture` is not set) |
| `--image-width` | `16384` | Width of the map PNG file in pixels |
| `--image-height` | `16384` | Height of the map PNG file in pixels |

### Examples

#### Tamriel (main Skyrim map)

```bash
python scripts/extract-fwmf-projection.py \
  --input "tamriel/tamriel.32.0.0.btr" \
  --output "src/pages/map/data/projections/tamriel.json" \
  --texture "skyrim.dds" \
  --image-width 16384 \
  --image-height 16384
```

#### Solstheim (DLC Dragonborn)

```bash
python scripts/extract-fwmf-projection.py \
  --input "dlc2solstheimworld/dlc2solstheimworld.32.0.0.btr" \
  --output "src/pages/map/data/projections/dlc2SolstheimWorld.json" \
  --texture "dlc2solstheimworld.dds" \
  --image-width 8192 \
  --image-height 8192
```

## Output JSON Format

```json
{
  "source": "path/to/file.btr",
  "meshName": "chunk:6",
  "blockIndex": 5,
  "texturePaths": ["textures\\terrain\\tamriel\\skyrim.dds"],
  "imageWidth": 16384,
  "imageHeight": 16384,
  "bounds": {
    "minX": -254800.0, "minY": -266800.0,
    "maxX": 266800.0,  "maxY": 254800.0,
    "minU": 0.0, "minV": 0.0,
    "maxU": 1.0, "maxV": 1.0
  },
  "vertexStride": 4,
  "triangleStride": 3,
  "vertices": [x, y, u, v, ...],
  "triangles": [i0, i1, i2, ...]
}
```

- `vertices` — flat array, 4 values per vertex: `[gameX, gameY, texU, texV]`
- `triangles` — flat array of vertex indices, 3 per triangle
- `bounds` — bounding rectangle in game and texture coordinates

## Adding a New Map

### Step 1: Place the PNG

Copy the map PNG file to `public/maps/<worldspace>.png`.

### Step 2: Generate DZI tiles

#### Locally (macOS)

Install `libvips`:

```bash
brew install vips
```

Generate tiles:

```bash
vips dzsave public/maps/<worldspace>.png public/map-dzi/<worldspace> \
  --layout dz \
  --tile-size 512 \
  --overlap 1 \
  --suffix '.webp[Q=80]'
```

After execution, the following will appear in `public/map-dzi/`:
- `<worldspace>.dzi` — XML manifest
- `<worldspace>_files/` — directory with WebP tiles by level

#### Via CI/CD

Run the [`build-map.yml`](.github/workflows/build-map.yml) workflow manually (workflow_dispatch) — it will download all PNGs from the `map-source` release, generate DZI for each, and upload the archive to the `map-assets` release.

### Step 3: Extract the projection

**Method A (BTR file available):** use [`extract-fwmf-projection.py`](scripts/extract-fwmf-projection.py):

```bash
python scripts/extract-fwmf-projection.py \
  --input <path to .btr file> \
  --output src/pages/map/data/projections/<worldspace>.json \
  --texture <texture path fragment> \
  --image-width <PNG width> \
  --image-height <PNG height>
```

**Method B (no BTR file):** calibration via reference points — see [map-projection-calibration.md](map-projection-calibration.md). In short:

1. Collect 3+ points (game coordinates → pixel coordinates) in a JSON file
2. Run [`calibrate-map-projection.py`](scripts/calibrate-map-projection.py):

```bash
python scripts/calibrate-map-projection.py \
  --image-width <PNG width> \
  --image-height <PNG height> \
  --points calibration_points.json \
  --output-projection src/pages/map/data/projections/<worldspace>.ts \
  --worldspace <WorldspaceEditorID> \
  --print-correction
```

The script will output bounds, `imageCorrection`, and error at each point (should be < 1 px).

### Step 4: Register the map

Add an entry to [`mapRegistry.ts`](src/pages/map/config/mapRegistry.ts):

```ts
import newMapProjection from '../data/projections/<worldspace>.json';

const newMapConfig: MapConfig = {
  worldspace: '<WorldspaceEditorID>',
  dziUrl: `${import.meta.env.BASE_URL}map-dzi/<worldspace>.dzi`,
  projectionData: newMapProjection as ProjectionData,
  // imageCorrection — optional, calibrated manually (see below)
  cropX: 0,         // adjust based on image edges
  cropYTop: 0,
  cropYBottom: 0,
};

export const mapRegistry: MapRegistry = {
  Tamriel: tamrielConfig,
  '<WorldspaceEditorID>': newMapConfig,
};
```

### Step 5: Calibrate (optional)

If needed, calibrate `imageCorrection` and `referencePoints` (see "imageCorrection Calibration" section).

## imageCorrection Calibration

The `imageCorrection` matrix compensates for the discrepancy between FWMF mesh UV coordinates and actual pixel coordinates on the hand-painted map.

To calibrate:
1. Open the map in the application
2. Click on known locations (cities) and record game coordinates and pixel coordinates from the console (`[map] image px: { x: ..., y: ... }`)
3. Compute the affine correction matrix using least squares
4. Add the matrix to the map config

## Script Verification

The [`extract-fwmf-projection.py`](scripts/extract-fwmf-projection.py) script has been verified:

- ✅ Correctly parses BTR/NIF files via `pyffi`
- ✅ Finds `NiTriShape` by texture or name
- ✅ Applies vertex transformation (rotation × scale + translation)
- ✅ Extracts UV coordinates
- ✅ Output format is compatible with `useMapProjection.ts`
- ⚠️ `imageWidth`/`imageHeight` are set manually — must match PNG dimensions
- ⚠️ `imageCorrection` is not extracted automatically — calibrated separately
- ⚠️ Dependency on `pyffi` — Python ≤ 3.11 recommended