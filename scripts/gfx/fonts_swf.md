# Font extraction from SWF (Skyrim fonts_ru.swf / fonts_en.swf)

## Overview

The files `public/fonts_ru.swf` and `public/fonts_en.swf` (Skyrim) store
fonts in **DefineFont3** format (tag code 75). Unlike `hudmenu.gfx`,
these files are regular SWF (not GFX/CXF), containing **Cyrillic fonts** and
other game fonts (Daedric, Dwemer, Dragon Script, SkyrimSymbols, etc.).

SWF files can be binary (FWS — uncompressed, CWS — zlib-compressed) or
in base64. The `fonts_swf.mjs` script automatically detects the format.

## Fonts in fonts_ru.swf

| # | Font Name | Glyphs | Valid | Codes | Description |
|---|---|---|---|---|---|
| 1 | **FuturaTCYLigCon** | 355 | 352 | U+0020..U+2265 | **Cyrillic Futura** — main Russian UI font |
| 2 | Futura Condensed test | 376 | 375 | U+0020..U+2122 | Extended Futura (Latin + extra symbols) |
| 3 | **FuturisXCondCTT** | 341 | 339 | U+0020..U+2122 | **Second Cyrillic font** (Futuris) |
| 4 | SkyrimBooks_Gaelic | 316 | 286 | U+0020..U+2215 | Book font (Gaelic style) |
| 5 | SkyrimBooks_Handwritten_Bold | 325 | 323 | U+0020..U+2260 | Book font (handwritten, bold) |
| 6 | SkyrimBooks_Unreadable | 27 | 5 | U+0020..U+00A0 | "Unreadable" book font |
| 7 | Dragon_script | 95 | 37 | U+0020..U+00A0 | Dragon language |
| 8 | **Daedric** | 55 | 52 | U+0020..U+00A0 | **Daedric alphabet** (A-Z) |
| 9 | Dwemer | 96 | 65 | U+0020..U+00A0 | Dwemer alphabet |
| 10 | Falmer | 96 | 29 | U+0020..U+00A0 | Falmer alphabet |
| 11 | SkyrimSymbols | 115 | 38 | U+0020..U+2122 | Skyrim symbols |
| 12 | Mage Script | 96 | 28 | U+0020..U+00A0 | Mage alphabet |

**Total:** 15 fonts (including 3 Arial duplicates with a single glyph ·),
~2400+ valid glyphs.

The main Russian font is **FuturaTCYLigCon** (Cyrillic Futura Condensed).

## How it works

### SWF Format

SWF (FWS/CWS/ZWS): 3 bytes signature + 1 byte version + 4 bytes size
+ RECT + frameRate + frameCount + tags.

After decompression/skipping the header — SWF body, starting with RECT.

### Reading DefineFont3 from SWF

DefineFont3 tag structure (code=75):

```
UI16 fontId | UI8 fontFlags | UI8 language | STRING fontName
| UI16 numGlyphs | []offsetTable (numGlyphs+1) | []glyphShapeTable
| []codeTable (UI16) | [FontLayout]
```

#### Wide Offsets

In `fonts_ru.swf`, offsets are read according to the rule:
- `hasLayout=true` + `wideOffsets=true` → UI32
- `hasLayout=false` → always UI16 (even with wideOffsets=true)

### Pipeline

```
SWF → parseSwfFonts() → DefineFont3 → parseGlyphShape() → edges
→ glyphEdgesToPath() → SVG path → fontToSvgFont() → SVG font
→ fonts_swf_convert.mjs (opentype.js) → TTF
```

## SVG font → TTF conversion

SVG fonts have been removed from Chrome 103+. TTF via opentype.js.

### Key metrics (verified against Skyrim reference)

| Parameter | Reference | Ours | Source |
|---|---|---|---|
| `unitsPerEm` | 1024 | 1024 | Fixed |
| `ascender` | 921 | `layout.ascent / 20` | SWF FontLayout |
| `descender` | -245 | `-(layout.descent / 20)` | SWF FontLayout |
| `advanceWidth` | 518 (A) | `layout.advances[i] / 20` | SWF FontLayout |
| bbox A | -7..526, 0..717 | -7..526, 0..717 | SVG path |

### Rules

1. **unitsPerEm = 1024** — the reference uses 1024, path coordinates
   from SVG font (upem=2048) are used as-is, without scaling.

2. **ascender/descender/advanceWidth** — from SWF FontLayout, divided
   by 20 (1 twip = 1/20 pixel → font units).

3. **Y-flip:** SVG font: `fy = -v * scale` (negative Y = above baseline).
   OpenType: positive Y = above baseline. During conversion Y is negated:
   `oTy = -svgY`.

### Result

For 95 verified characters:
- advanceWidth: **100% match**
- bbox: ±1 unit due to Y-flip rounding
- ascender: 922 vs 921 (0.1%)
- descender: -245 — exact match

TTF size: ~38 KB vs ~64 KB (reference contains hinting and metadata).

## Usage

### 1. Extraction

```bash
node scripts/gfx/fonts_swf.mjs public/fonts_ru.swf scripts/gfx/out/fonts_swf
node scripts/gfx/fonts_swf.mjs public/fonts_en.swf scripts/gfx/out/fonts_en
```

### 2. Conversion to TTF

```bash
node scripts/gfx/fonts_swf_convert.mjs scripts/gfx/out/fonts_swf
```

### 3. Gallery (self-contained, file://)

```bash
node scripts/gfx/gallery_swf.mjs scripts/gfx/out/fonts_swf
# Open scripts/gfx/out/fonts_swf/gallery.html
```

### 4. Comparison with reference

```bash
cp original.ttf scripts/gfx/out/fonts_swf/7_Original.ttf
node scripts/gfx/gen_compare.mjs
# Open compare.html
```

### 5. CSS integration

```css
@font-face {
  font-family: 'FuturaTCYLigCon';
  src: url('fonts_swf/FuturaTCYLigCon/FuturaTCYLigCon.ttf') format('truetype');
}
```

## Scripts

| Script | Purpose |
|---|---|
| `fonts_swf.mjs` | Font extraction from SWF |
| `fonts_swf_convert.mjs` | SVG font → TTF conversion (opentype.js) |
| `gallery_swf.mjs` | Self-contained HTML gallery with TTF base64 |
| `gen_compare.mjs` | Comparison page with reference TTF |

## API — `fonts_swf.mjs`

### `parseSwfFonts(swfBody)`
Parses DefineFont2/3 from SWF body. Returns `GfxFont[]`.

### `decompressSwfBody(data)` / `decodeSwfInput(input)`
CWS decompression and input normalization.

## Limitations

- **SVG fonts removed from Chrome 103+** — use TTF.
- **No hinting** — may appear blurry at small sizes (<16px).
- **Not all glyphs parse** — some have non-standard format.
- **ZWS (LZMA)** is not supported.
- **TTF size smaller than reference** (~40 KB vs ~64 KB) due to lack of
  hinting, OS/2 metadata, and GPOS/GSUB tables.
- **Fonts without layout** — advanceWidth is approximated.

## References

- `scripts/gfx/fonts_swf.mjs` — extraction from SWF
- `scripts/gfx/fonts_swf_convert.mjs` — conversion to TTF
- `scripts/gfx/lib.mjs` — shared library
- `scripts/gfx/fonts.md` — GFX documentation
- `scripts/gfx/out/fonts_swf/gallery.html` — gallery
- `scripts/gfx/out/fonts_swf/compare.html` — comparison with reference