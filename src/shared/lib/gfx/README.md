# GFX Parser — TypeScript module

Runtime Scaleform GFX (Skyrim HUD) parser for the browser.

## Files

```
src/shared/lib/gfx/
├── index.ts       # Public API
├── types.ts       # Types (GfxFile, GfxShapeInfo, FillStyle, ...)
├── parser.ts      # GFX decompression + SWF tag parsing
└── shape.ts       # DefineShape parsing + SVG generation
```

## Quick start

```ts
import { parseGfx, parseShape, shapeToSvg } from '@/shared/lib/gfx';

// Load the user's GFX file
const response = await fetch('/hudmenu.gfx');
const buffer = await response.arrayBuffer();

// Decompress and parse tags
const gfx = await parseGfx(buffer);

console.log(gfx.version);       // 15
console.log(gfx.frameSize);     // { xmin, xmax: 25600, ymin, ymax: 14400 }
console.log(gfx.exports.size);  // 308 (characterId → name)
console.log(gfx.shapes.length); // 405 (all DefineShape*)

// Get the symbol name by characterId
const name = gfx.exports.get(139); // e.g. "Z.png"

// Parse a specific shape and get SVG
const shapeInfo = gfx.shapes[0]; // first DefineShape
const shape = parseShape(gfx.rawSwf, shapeInfo.dataOffset + 2, shapeInfo.code);
const svg = shapeToSvg(shape); // string: "<svg xmlns=...>"

// Use the SVG in the DOM
document.querySelector('#icon').innerHTML = svg;
```

## API

### `parseGfx(buffer: ArrayBuffer): Promise<GfxFile>`

Decompresses a GFX file and parses all tags.

Returns:
- `version` — GFX version
- `frameSize` — frame size in twips (1/20 px)
- `frameRate` — frame rate
- `exports` — `Map<number, string>` (characterId → symbol name)
- `shapes` — array of `GfxShapeInfo[]` with information about each DefineShape
- `rawSwf` — decompressed SWF buffer for further parsing

### `parseShape(buf: Uint8Array, pos: number, code: number): ParsedShape`

Parses a DefineShape from a decompressed SWF buffer.

- `buf` — `gfx.rawSwf`
- `pos` — byte offset of the tag data start (`shapeInfo.dataOffset + 2`)
- `code` — tag code (2/22/32/83 = DefineShape/2/3/4)

Returns `ParsedShape`:
- `bounds` — { xmin, xmax, ymin, ymax } in twips
- `fills` — array of `FillStyle[]`
- `lines` — array of `LineStyle[]`
- `contours` — legacy structure grouped only on explicit MoveTo (display only, not used for rendering)
- `edges` — flat list of individual edges (straight/curved), each carrying the `fill0`/`fill1`/`line` values active at the time the edge was read

`edges` is the correct input for rendering: a mid-contour StyleChangeRecord that
changes `fill0`/`fill1` without a MoveTo is captured per-edge, which the
contour-only structure cannot represent.

### `shapeToSvg(shape: ParsedShape, scale?: number): string`

Converts a parsed shape into an SVG string.

- `scale` — twips → px scale (default 1/20)

## Limitations of the current version

- **Gradients**: rendered with the middle color (not a full gradient)
- **Bitmap fill**: not supported (2 shapes: 469, 711)
- **LineStyle2**: the placeholder is read, but not all flags are interpreted

Fill rendering is JPEXS-style: `fill1` edges are kept as-is and `fill0` edges are
reversed, then closed subpaths are rebuilt by endpoint matching. This correctly
handles mid-contour fill changes (StyleChangeRecord without MoveTo).

## Caching in the app

The generated SVG set is cached by the `gfx-icons` feature in **IndexedDB**
(database `gfx-icons`), not in `localStorage`. See
[`src/features/gfx-icons/README.md`](../../features/gfx-icons/README.md) for the
storage schema, load lifecycle and the manual re-initialization flow.

## Dependencies

- `DecompressionStream` (browser API, available in Chrome 80+, Safari 16.4+, Firefox 113+)
- Node.js — only for tests (uses `node:zlib`)

## Compatibility

The parser works with Scaleform GFX version 15 files (Skyrim). Theoretically compatible with any GFX files from Scaleform 4.x+.
