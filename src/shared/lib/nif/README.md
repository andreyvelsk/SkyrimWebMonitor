# NIF thumbnails

Renders inventory thumbnails from the game's own item models.

```
src/shared/lib/nif/
├── reader.ts            # little-endian binary cursor
├── parseNif.ts          # Skyrim LE (BS 83) / SE (BS 100) geometry reader
├── renderThumbnail.ts   # WebGL 1 renderer → WebP/PNG data URL
├── types.ts
└── tests/               # synthetic-NIF unit tests
```

## What the parser reads

Only what a still image needs; every other block is skipped through the
header's block-size table, so unknown blocks never break a model.

| Block | Used for |
|---|---|
| `NiNode`, `BSFadeNode`, … | scene graph + transforms (hidden nodes skipped) |
| `BSTriShape`, `BSMeshLODTriShape`, `BSSubIndexTriShape`, `BSDynamicTriShape` | SSE geometry (inline vertex data) |
| `NiSkinPartition` (SSE) | geometry of skinned shapes (shared vertex buffer + "triangles copy") |
| `NiTriShape` / `NiTriStrips` + data | LE-style geometry |
| `BSLightingShaderProperty` → `BSShaderTextureSet` | diffuse texture path (slot 0) |
| `NiAlphaProperty` | alpha-test cut-outs |
| `BSInvMarker` | the game's own inventory framing (euler Z→Y→X, thousandths of a radian) |

Shapes with `BSEffectShaderProperty` (glows, blood decals) are left out.

## Rendering

`renderNifThumbnail(model, { size, tint, textures, framing })` draws with a
single shared WebGL context (mobile browsers cap live contexts). Framing uses
`BSInvMarker` when present; otherwise the thinnest bounding-box axis faces the
camera and the longest one runs diagonally (`diagonal`, weapons) or upright
(`upright`, apparel; flat rings/circlets are tilted to show the loop).

Textures come from the plugin's `texture_preview` command with `maxSize`
(plugin feature `texture_preview.maxSize`). Meshes without a decodable texture
(e.g. BC7) use the material tint from `@/shared/lib/constants/itemMaterials`.

Caching, queueing and feature gating live in `@/stores/item-thumbnails`.
