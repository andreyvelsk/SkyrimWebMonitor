# GFX Parser — research and debugging

Parsing Scaleform GFX files (Skyrim HUD) with extraction of vector graphics into SVG.

> In the app, the generated SVGs are cached in **IndexedDB** (database
> `gfx-icons`), not `localStorage`. See
> [`src/features/gfx-icons/README.md`](../src/features/gfx-icons/README.md).

## Structure

```
scripts/gfx/
├── README.md          # This file
├── lib.mjs            # Wrapper: base64/buffer → decompress → parse (shared code)
├── generate.mjs       # Generate SVG from GFX (uses lib.mjs)
├── gallery.mjs        # Generate an HTML gallery for comparison with the reference
├── inspect.mjs        # Inspect GFX structure (uses lib.mjs)
├── names.mjs          # Extract icon names (uses lib.mjs)
└── out/               # Generated files (gitignored)
    ├── svg/           # SVG from my parser
    ├── ref/           # Reference SVG from JPEXS
    ├── names.json     # JSON mapping shapeId → [names]
    └── gallery.html   # HTML comparison gallery (with icon names)
```

### Extracting icon names

```bash
node scripts/gfx/names.mjs public/hudmenu.gfx scripts/gfx/out/names.json
```

The result is JSON with 289 shapeIds, for example:
```json
{"139": ["QuestMarker","quest_green"], "232": ["Stormcloak Camp Undiscovered"]}
```

gallery.mjs automatically substitutes names from names.json when generating the gallery.

### Full pipeline

```bash
# 1. Reference
java -jar /tmp/ffdec/ffdec-cli.jar -export shape scripts/gfx/out/ref public/hudmenu.gfx

# 2. Names
java -jar /tmp/ffdec/ffdec-cli.jar -swf2xml public/hudmenu.gfx scripts/gfx/out/hudmenu.xml
python3 scripts/gfx/names.py scripts/gfx/out/hudmenu.xml scripts/gfx/out/names.json

# 3. My parser
node scripts/gfx/generate.mjs public/hudmenu.gfx scripts/gfx/out/svg

# 4. Gallery (with names)
node scripts/gfx/gallery.mjs scripts/gfx/out/svg scripts/gfx/out/ref scripts/gfx/out/gallery.html
open scripts/gfx/out/gallery.html
```

## The `lib.mjs` wrapper (base64 / buffer / file)

Three scripts (`generate.mjs`, `inspect.mjs`, `names.mjs`) share the common module
[`lib.mjs`](scripts/gfx/lib.mjs) — a wrapper around the "read → decompress → parse" pipeline.
Inputs can be:

- a **base64 string** (including `data:...;base64,...`)
- **Uint8Array / ArrayBuffer / Buffer** — raw GFX file bytes (e.g. from `readFileSync`)

The module works in both Node.js and the browser (decompression via `DecompressionStream`;
there are no Node-specific imports inside).

### API

| Function | Purpose |
|---|---|
| `parseGfx(input)` | `{ gfx, swf, header, exports, shapes }` — decompress + parse tags |
| `parseShapes(input)` | `[{ shapeId, code, parsed, svg \| error }]` — parse all DefineShape + SVG |
| `generateSvg(input)` | `{ [shapeId]: svg-string }` — only successful SVGs |
| `extractNames(swf)` | `Map<shapeId, Map<spriteId, name>>` — icon names |
| `base64ToBytes(base64)` | base64 → `Uint8Array` |

### Example: base64

```js
import { parseGfx, generateSvg } from './scripts/gfx/lib.mjs';

const base64 = 'Q0ZY...'; // the file in base64

const { header, exports, shapes } = await parseGfx(base64);
const svgMap = await generateSvg(base64);

console.log(shapes.length);          // 405
console.log(Object.keys(svgMap).length); // 403
```

### Example: buffer/file directly

```js
import { readFileSync } from 'node:fs';
import { parseGfx, generateSvg } from './scripts/gfx/lib.mjs';

const buf = readFileSync('public/hudmenu.gfx');
const { shapes } = await parseGfx(buf); // Buffer is also accepted
const svgMap = await generateSvg(buf);
```

### Full pipeline from a base64 file (commands)

The scripts auto-detect the input file type: binary GFX (signature `CFX`) or
base64 text. The commands are the same as for a regular `.gfx` file:

```bash
# Prepare a base64 file (if it isn't already in this form)
base64 < public/hudmenu.gfx > scripts/gfx/out/hudmenu.gfx.b64

# 1. Generate SVG from a base64 file
node scripts/gfx/generate.mjs scripts/gfx/out/hudmenu.gfx.b64 scripts/gfx/out/svg

# 2. Names from a base64 file
node scripts/gfx/names.mjs scripts/gfx/out/hudmenu.gfx.b64 scripts/gfx/out/names.json

# 3. Gallery (SVG + reference + names.json)
node scripts/gfx/gallery.mjs scripts/gfx/out/svg scripts/gfx/out/ref scripts/gfx/out/gallery.html
open scripts/gfx/out/gallery.html
```

### Behavior is identical to the previous scripts

- `generate.mjs` → 403 SVGs, 2 errors (shapeId 469 and 711 — bitmap fill).
- `inspect.mjs` → the same tag/shape statistics.
- `names.mjs` → the same `names.json`.

## Debugging process

### 1. Generate the reference (JPEXS)

```bash
# Install JPEXS CLI (download from GitHub)
# https://github.com/jindrapetrik/jpexs-decompiler

# Export all shapes to SVG
java -jar /tmp/ffdec/ffdec-cli.jar -export shape scripts/gfx/out/ref public/hudmenu.gfx

# Convert GFX → XML (for detailed study)
java -jar /tmp/ffdec/ffdec-cli.jar -swf2xml public/hudmenu.gfx scripts/gfx/out/hudmenu.xml
```

### 2. Generate SVG with my parser

```bash
node scripts/gfx/generate.mjs [gfx-file] [output-dir]
# Example:
node scripts/gfx/generate.mjs public/hudmenu.gfx scripts/gfx/out/svg
```

### 3. Create a comparison gallery

```bash
node scripts/gfx/gallery.mjs [my_svgs] [reference_svgs] [output.html]
# Example:
node scripts/gfx/gallery.mjs scripts/gfx/out/svg scripts/gfx/out/ref scripts/gfx/out/gallery.html
open scripts/gfx/out/gallery.html
```

### 4. Inspect the structure

```bash
# Tag statistics + parsing errors
node scripts/gfx/inspect.mjs public/hudmenu.gfx --stats

# Parse a specific shape
node scripts/gfx/inspect.mjs public/hudmenu.gfx 139

# Export symbol names
node scripts/gfx/inspect.mjs public/hudmenu.gfx --export
```

## GFX format

### Wrapper
- `CFX` signature (3 bytes)
- Version (1 byte, usually 15)
- Decompressed stream size (4 bytes, LE)
- Zlib-compressed SWF stream (starts with `0x78`)

### SWF body (after decompression)
- RECT FrameSize (5+Nbits*4 bits)
- FrameRate (UI16, 8.8 fixed)
- FrameCount (UI16)
- Tags (code + length + data)

### Key tags in hudmenu.gfx
- **ExportAssets** (56): 308 symbols with names
- **DefineShape** (2): 163 shapes (Shape1)
- **DefineShape2** (22): 10 shapes (Shape2)
- **DefineShape3** (32): 229 shapes (Shape3)
- **DefineShape4** (83): 3 shapes (Shape4)
- **DefineSprite** (39): 291 sprites

### DefineShape structure
- ShapeId (UI16)
- ShapeBounds (RECT)
- For Shape4: EdgeBounds (RECT) + flags (1 byte)
- FILLSTYLEARRAY: FillStyleCount + FillStyle[]
- LINESTYLEARRAY: LineStyleCount + LineStyle[]
- NumFillBits (4 bits) | NumLineBits (4 bits)
- ShapeRecords (StyleChange, StraightEdge, CurvedEdge, EndShape)

## Nuances found

### 1. NumBits = (actual bits - 2)
**Critical bug.** In StraightEdge and CurvedEdge, the `NumBits` field (4 bits) stores the bit count **minus 2**. My parser read `nBits` bits for the deltas, but it needs `nBits + 2`.

```js
// Wrong:
const nBits = r.readBits(4);
// Right:
const nBits = r.readBits(4) + 2;
```

This fix raised the parse coverage from 13% to 93.6%.

### 2. GradientMatrix in Scaleform
In Scaleform GFx, **all** gradients (linear/radial/focal) have a MATRIX before the gradient data — not only in DefineShape4. Standard SWF only contains a MATRIX in Shape4.

```js
// For all gradient types (0x10, 0x12, 0x13):
pos = skipMatrix(buf, pos); // always skip the MATRIX
```

### 3. LineStyle2 in Shape4
DefineShape4 uses LineStyle2 (width + UI16 flags + RGBA color), not a plain LineStyle.

```js
if (shapeVersion >= 4) {
    pos += 2; // LineStyle2 flags
}
```

### 4. StateNewStyles in Scaleform
Scaleform uses `StateNewStyles` in shape records (replacing fill/line styles inside a contour). My parser handles this, but there are positioning issues with bitmap fills.

### 5. fill0/fill1 order in StyleChangeRecord
The bit order is: TypeFlag, StateNewStyles, StateLineStyle, **StateFillStyle1, StateFillStyle0**, StateMoveTo.
Fill0 and Fill1 are read in the order: **FillStyle1, FillStyle0** (not FillStyle0, FillStyle1).

### 6. Fill rendering is edge-based, not contour-based
The correct way to render fills is to work with a **flat list of edges**, not with
"contours" grouped by MoveTo. `parseShapeRecords()` now returns both:

```js
const { contours, edges } = parseShapeRecords(...);
```

- `contours` — legacy structure grouped only on explicit MoveTo. Kept solely for
  [`inspect.mjs`](scripts/gfx/inspect.mjs) display purposes. It captures fill0/fill1
  once at MoveTo time, so it is **wrong** when a mid-contour StyleChangeRecord
  changes the fill. Never use it for fill rendering.
- `edges` — every straight/curved edge individually, with the fill0/fill1/line values
  that were active **at the moment that edge was read**. This naturally captures
  mid-contour fill changes (StyleChangeRecord with `sF0`/`sF1` but no MoveTo),
  which Scaleform uses heavily (e.g. shapeId=267).

### 7. Reconstructing paths from edges (JPEXS-style)
`buildSvg()` does not emit one path per source contour. Instead, for each fill index
`k` it collects a "bag" of edges:

- every edge with `fill1 === k`, **as-is**;
- every edge with `fill0 === k`, **reversed** (`reverseEdge()` — for a `Q` curve the
  control point stays, only the start/end anchors swap).

Then `reconstructPaths()` stitches those edges into **closed loops by matching
endpoints** (hash edges by start point, greedily follow the chain until you return to
the loop's start). This yields the same minimal subpath structure as JPEXS, even when
the edges of one fill are interleaved with other fills in the original record stream.

SWF fill semantics: `fill1` is the fill on the **right** of the edge direction, `fill0`
is on the **left**. Reversing the `fill0` edges puts `k` on the right as well, so all
edges in a bag are consistent and `fill-rule="evenodd"` works uniformly.

```js
// lib.mjs — buildFillPathsFromEdges():
for (const e of edges) {
    if (e.fill1 > 0) addTo(e.fill1, e);            // as-is
    if (e.fill0 > 0) addTo(e.fill0, reverseEdge(e)); // reversed
}
// then reconstructPaths(bag) → closed loops → 'd' string
```

Line strokes use the same edge reconstruction (`buildLinePathsFromEdges()`), because
strokes don't care about direction but still benefit from correct loop joining.

## Remaining errors

### 403/405 (99.5%) — 2 shapes failed
- **shapeId=469** (DefineShape, len=513): bitmap fill (0x40) inside StateNewStyles causes an out-of-bounds read
- **shapeId=711** (DefineShape3, len=131): the same bitmap fill problem

Both shapes use bitmap textures (bitmap fill) — references to embedded images, not vector fills.

### Fill logic — FIXED ✓

**Problem shapes:** 141, 171, 267, 341, 365, 194 — now match the reference
path structure (number of subpaths per fill) exactly.

**What was wrong before**

Rendering grouped edges by "contours" (MoveTo-delimited blocks). Two issues:

1. **Missing reversal.** SWF semantics: `fill1` is the fill on the **right** of an
   edge, `fill0` on the **left**. An edge with `fill0=k` must be **reversed** before
   it can share a path with edges whose `fill1=k`. The old code emitted both fills
   without reversing, producing duplicate geometry with wrong winding.
2. **Mid-contour fill changes.** A `StyleChangeRecord` with `sF0`/`sF1` but **no
   MoveTo** changes the active fill in the middle of a contour. Contour-based grouping
   captured fill0/fill1 only once per contour, so edges after the change were assigned
   to the wrong fill.

**Final solution** (see nuances 6–7 above for the full explanation):

1. `parseShapeRecords()` emits a flat `edges` array, where each edge carries the
   fill0/fill1/line active at the moment it was read — mid-contour fill changes are
   therefore captured exactly.
2. `buildSvg()` uses `buildFillPathsFromEdges()`:
   - `fill1 === k` edges go to bag `k` **as-is**;
   - `fill0 === k` edges go to bag `k` **reversed** (`reverseEdge()`);
   - `reconstructPaths()` stitches each bag into closed loops by endpoint matching.
3. Line strokes use the same reconstruction (`buildLinePathsFromEdges()`).

The legacy `contours` structure is retained only for [`inspect.mjs`](scripts/gfx/inspect.mjs)
display output and is **not** used for rendering.

**What didn't work (previous attempts):**
1. **Winding-direction analysis** (signed area via shoelace) — Q-curves were approximated incorrectly.
2. **Fill1-priority** (skip fill0 when fill1 is set) — removed necessary contours.
3. **Fill0-priority** (fill0 || fill1 without reverse) — extra contours, wrong winding.
4. **groupOnStyleChange=true** — split on every style change including `sLine`/`sNew`, broke evenodd fill for 22+ shapes.
5. **Mid-contour split without reverse** — fixed fill attribution but still left
   duplicate subpaths, because splitting alone doesn't reconnect edges into JPEXS's
   minimal loop structure.

### shapeId=269 — gradient fills (not yet implemented)
JPEXS renders 4 paths (3 gradients + 1 solid). Our parser outputs only the solid fill.
Gradient SVG rendering requires proper `<linearGradient>`/`<radialGradient>` elements with the gradient matrix — not yet implemented (currently approximated with the midpoint color).
