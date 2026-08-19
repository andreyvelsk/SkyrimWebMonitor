# Font Application Principle

## Overview

The application supports two font modes:

1. **Standard fonts** — the default web fonts (`Cinzel` for headings, `Cormorant Garamond` for body text), loaded from static `public/fonts/` assets via `@font-face` in the base stylesheet.
2. **Game fonts (GFX fonts)** — fonts extracted from Skyrim's SWF files (`interface/fonts_ru.swf` / `interface/fonts_en.swf`), parsed client-side, converted to TTF, cached in IndexedDB, and injected as `@font-face` rules.

The primary game font is `FuturaTCYLigCon` (defined in [`PRIMARY_FONT_NAME`](src/features/gfx-fonts/config/gfxFonts.ts:30)).

---

## Architecture

### Layers

| Layer | File | Responsibility |
|---|---|---|
| `shared/` | [`src/shared/lib/fonts/`](src/shared/lib/fonts/) | SWF parsing, TTF conversion, type definitions |
| `features/gfx-fonts/` | [`src/features/gfx-fonts/`](src/features/gfx-fonts/) | Font loading orchestration, IndexedDB storage, `@font-face` injection |
| `stores/gfx-fonts/` | [`src/stores/gfx-fonts/useGfxFontsStore.ts`](src/stores/gfx-fonts/useGfxFontsStore.ts) | Reactive state, root CSS class toggling |
| `shared/lib/settings/` | [`src/shared/lib/settings/gfxFontsPreference.ts`](src/shared/lib/settings/gfxFontsPreference.ts) | Singleton `gfxFontsDisabled` ref + localStorage persistence |
| `shared/lib/styles/` | [`src/shared/lib/styles/variables.scss`](src/shared/lib/styles/variables.scss) | CSS custom properties for both font modes |
| `app/` | [`src/app/lib/composables/useAppLoader.ts`](src/app/lib/composables/useAppLoader.ts) | App initialization — triggers early hydration and WebSocket-dependent loading |

### Data Flow

```
App mount
  │
  ├── Early hydration (useAppLoader.onMounted)
  │     └── hydrateFromStorage()
  │           ├── Read manifest from IndexedDB
  │           ├── If manifest exists → inject @font-face for each cached font
  │           └── Call store.setFontsLoaded() → toggle .gfx-fonts-enabled on <html>
  │
  └── WebSocket connect
        └── features watcher (file_download available)
              └── ensureLoaded()
                    ├── hydrateFromStorage() (retry if early hydration was skipped)
                    └── If no cache → download SWF → parse → convert → cache → inject
```

### Font Application Mechanism

Fonts are applied **entirely through CSS**. The store only toggles a class on `<html>`; the CSS custom properties react to that class.

#### CSS Custom Properties (`--font-heading`, `--font-body`)

Defined in [`variables.scss`](src/shared/lib/styles/variables.scss:33-41):

```scss
:root {
  /* ... */
  --font-heading: 'Cinzel', serif;
  --font-body: 'Cormorant Garamond', serif;
}

:root.gfx-fonts-enabled {
  --font-heading: 'FuturaTCYLigCon', 'Cinzel', serif;
  --font-body: 'FuturaTCYLigCon', 'Cormorant Garamond', serif;
}
```

When the store adds `.gfx-fonts-enabled` to `<html>`, the CSS cascade automatically overrides `--font-heading` and `--font-body` with the game font as the first choice. When the class is removed, the defaults apply.

All components use these variables via `font-family: var(--font-heading)` / `font-family: var(--font-body)` — no JavaScript style manipulation needed.

#### Root CSS Classes (`gfx-fonts-enabled` / `gfx-fonts-disabled`)

The store toggles these classes on `<html>`:

| Class | When |
|---|---|
| `gfx-fonts-enabled` | Game fonts are active and applied |
| `gfx-fonts-disabled` | Game fonts are disabled or not loaded |

These classes allow component-level style overrides beyond just the font-family. Example usage in SCSS:

```scss
.some-element {
  letter-spacing: 0.05em;

  .gfx-fonts-enabled & {
    letter-spacing: 0;  // Tighter spacing for game font
  }
}
```

---

## Key Components

### [`useGfxFontsStore`](src/stores/gfx-fonts/useGfxFontsStore.ts)

Reactive state:

| Property | Type | Description |
|---|---|---|
| `isReady` | `Ref<boolean>` | Fonts are loaded and injected |
| `isLoading` | `Ref<boolean>` | Font loading in progress |
| `error` | `Ref<string \| null>` | Last error message |
| `activeFonts` | `Ref<string[]>` | List of loaded font names |
| `primaryFontName` | `Ref<string \| null>` | Primary font name (e.g. `FuturaTCYLigCon`) |
| `useGameFonts` | `Ref<boolean>` | Whether game fonts should be applied |

Key methods:

| Method | Description |
|---|---|
| `setFontsLoaded(fontNames, primary)` | Marks fonts as ready, toggles `.gfx-fonts-enabled` on `<html>` if `useGameFonts` is true |
| `updateUseGameFonts(value)` | Toggles game fonts on/off, persists preference, toggles root class |
| `reset()` | Clears state, removes root class |

The store does **not** manipulate CSS custom properties directly — it only toggles the root class. The CSS cascade in `variables.scss` handles the rest.

### [`useGfxFontsLoader`](src/features/gfx-fonts/helpers/useGfxFontsLoader.ts)

| Method | Description |
|---|---|
| `hydrateFromStorage()` | Reads fonts from IndexedDB cache and injects them. Returns `true` if successful. Does NOT require WebSocket. |
| `ensureLoaded()` | Full load: tries cache first, then downloads via WebSocket. Returns a promise. |
| `reinitialize()` | Clears cache and re-downloads fonts from server. |

### [`gfxFontsDisabled`](src/shared/lib/settings/gfxFontsPreference.ts)

Module-level singleton `Ref<boolean>` initialized from `localStorage` key `skyrim-monitor-gfx-fonts-disabled`. Used by:

- [`useAppLoader`](src/app/lib/composables/useAppLoader.ts:125) — gates font loading on WebSocket feature detection
- [`useAppLoader`](src/app/lib/composables/useAppLoader.ts:91) — gates early hydration
- [`GfxFontsSettings.vue`](src/features/settings/ui/gfx-fonts-settings/GfxFontsSettings.vue) — UI toggle (via store)

---

## Initialization Flow (Detailed)

### Step 1: App Mount ([`useAppLoader.onMounted`](src/app/lib/composables/useAppLoader.ts:81))

```typescript
// 1a. Prefetch map tiles (background)
void prefetchMapTiles(...);

// 1b. Early font hydration (background, no WebSocket needed)
if (!gfxFontsDisabled.value) {
  void gfxFontsLoader.hydrateFromStorage();
}

// 1c. Connect WebSocket
await connect();
```

If fonts are cached in IndexedDB, they are injected immediately. The store toggles `.gfx-fonts-enabled` and CSS applies the game font vars. The user sees game fonts right away, even if the game is not running.

### Step 2: WebSocket Connected ([`features` watcher](src/app/lib/composables/useAppLoader.ts:117))

When the `file_download` feature is detected:

```typescript
if (!gfxFontsDisabled.value) {
  void gfxFontsLoader.ensureLoaded();
}
```

- If early hydration already succeeded → `isReady` is `true` → `ensureLoaded()` returns immediately
- If early hydration was skipped (e.g. no cache) → downloads SWF, parses, caches, injects

### Step 3: User Toggle ([`GfxFontsSettings.vue`](src/features/settings/ui/gfx-fonts-settings/GfxFontsSettings.vue))

The settings component calls `store.updateUseGameFonts(!disabled)`, which:

1. Updates `useGameFonts` ref
2. Persists to localStorage via `persistGfxFontsDisabled`
3. Toggles `.gfx-fonts-enabled` / `.gfx-fonts-disabled` on `<html>`
4. CSS cascade applies the corresponding `--font-heading` / `--font-body` values

---

## `@font-face` Injection

Each game font is injected as a `style` element in `<head>`:

```css
@font-face {
  font-family: 'FuturaTCYLigCon';
  src: url('data:font/ttf;base64,<base64>') format('truetype');
  font-display: swap;
}
```

The `style` element is tagged with `data-font-name="gfx-font-<fontName>"` for cleanup during reinitialization.

---

## IndexedDB Schema

| Store | Key | Value |
|---|---|---|
| `fonts` | `fontName` (string) | `{ fontName, ttfBase64, updatedAt }` |
| `manifest` | `id` (`'main'`) | `{ id, ready, fontNames, generatedAt }` |

Database name: `gfx-fonts` (config in [`gfxFonts.ts`](src/features/gfx-fonts/config/gfxFonts.ts:15))

---

## CSS Class Reference

The store toggles these classes on `<html>`:

| Class | Effect on `--font-heading` / `--font-body` |
|---|---|
| *(none)* | Default: `'Cinzel', serif` / `'Cormorant Garamond', serif` |
| `.gfx-fonts-enabled` | Game font first: `'FuturaTCYLigCon', 'Cinzel', serif` / `'FuturaTCYLigCon', 'Cormorant Garamond', serif` |
| `.gfx-fonts-disabled` | Same as default (explicit marker for styling) |

Example: adjusting letter-spacing per font mode:

```scss
:root {
  --game-font-letter-spacing: 0.05em;
}

:root.gfx-fonts-enabled {
  --game-font-letter-spacing: 0;
}

.element {
  letter-spacing: var(--game-font-letter-spacing);
}
```

Or use the class directly in component styles:

```scss
.my-component {
  .gfx-fonts-enabled & {
    // Styles specific to game font mode
  }
  .gfx-fonts-disabled & {
    // Styles specific to standard font mode
  }
}
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Game fonts not applied on fresh load | No IndexedDB cache, WebSocket not connected | Wait for connection or check `file_download` feature |
| `disableGfxFonts` toggle has no effect | Settings component calls `persistGfxFontsDisabled` directly instead of `store.updateUseGameFonts` | Use store method (fixed in current code) |
| Fonts flash and then disappear | `@font-face` not injected before render | Check early hydration in `useAppLoader` |
| Console error `Failed to load fonts` | SWF download failed or parse error | Check server file paths in config |