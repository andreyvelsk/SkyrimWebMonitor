# SkyrimWebMonitor Design System

A Bootstrap-like atomic design system with a Skyrim theme.
The single entry point is `skyrim-theme.scss` (imported once from [src/main.js](../../../main.js)).

## Structure

```
styles/
├── skyrim-theme.scss      # entry — layer order
├── variables.scss         # design tokens (colors, spacing, typography, z-index, ...)
├── base.scss              # reset, body, scrollbars
├── animations.scss        # keyframes + .animate-* helpers
├── utilities/             # atomic utilities (Bootstrap-style)
│   ├── _index.scss
│   ├── spacing.scss       # p-*, m-*, gap-*
│   ├── flexbox.scss       # d-flex, flex-*, justify-*, items-*
│   ├── display.scss       # d-block, d-none, overflow-*
│   ├── sizing.scss        # w-*, h-*, size-*, aspect-*
│   ├── typography.scss    # text-*, font-*, tracking-*, leading-*
│   ├── colors.scss        # text-*, bg-*, border-*
│   ├── borders.scss       # rounded-*, border, border-b-2, ...
│   ├── effects.scss       # shadow-*, transition-*, opacity-*
│   ├── position.scss      # static/relative/absolute/fixed, z-*
│   └── interactivity.scss # cursor-*, select-*, touch-*
└── components/            # reusable UI classes
    ├── _index.scss
    ├── button.scss        # .btn, .btn-primary/secondary/danger/ghost/icon, .btn-sm/lg/block
    ├── modal.scss         # .modal-backdrop, .modal-panel, .modal-content/header/title/actions
    ├── panel.scss         # .panel, .panel--elevated/accent/danger, .card
    ├── badge.scss         # .badge, .badge--gold/dim/danger/corner
    ├── input.scss         # .input, .input-group
    ├── tabs.scss          # .tab-bar, .tab, .subtab-bar, .subtab
    └── list.scss          # .list, .list--md, .list-divider, .empty-state, .no-data
```

## CSS Layers (order matters)

| # | Layer | Purpose |
|---|-------|---------|
| 1 | **variables** | CSS variables (tokens) |
| 2 | **base** | Reset, base tags, scrollbars |
| 3 | **utilities** | Atomic classes (low specificity) |
| 4 | **components** | Ready-made UI blocks (`.btn`, `.modal-*`, `.tab`, ...) |
| 5 | **animations** | Global `@keyframes` + `.animate-*` helpers |

## Principles

1. **Utilities first, component classes second.** If a pattern repeats ≥ 3 times, promote it to `components/`.
2. **Component-specific styles live with the component** (inside `<style scoped>`).
   Only reusable patterns belong in `components/`.
3. **No hard-coded values.** Use tokens from `variables.scss`.
4. **CSS variables, not SCSS variables**, for runtime values (colors, sizes).
5. **Use `@use` modules, not `@import`.**

## Design Tokens (`variables.scss`)

### Spacing
`--spacing-xs (4px)` · `sm (8px)` · `md (16px)` · `lg (24px)` · `xl (32px)`

### Sizes (for square elements / icons)
`--size-xs (16)` · `sm (24)` · `md (32)` · `lg (40)` · `xl (48)` · `2xl (64)`

### Typography
- `--font-heading: 'Cinzel', serif` — headings, buttons
- `--font-body: 'Cormorant Garamond', serif` — body text
- `--font-size-xs/sm/base/lg/xl`

### Colors
- Background: `--skyrim-bg-dark/medium/light`
- Text: `--skyrim-text-primary/secondary/accent/dim`
- Accent: `--skyrim-accent-gold/-light/-dim`
- Semantic: `--color-success`, `--color-danger`, `--color-warning`
- Translucent overlays: `--bg-accent-faint/-soft/-medium/-strong`

### Effects
- Shadows: `--shadow-soft/medium/strong`, `--glow-accent`, `--bg-inset-dark`
- Radii: `--radius-sm/md/lg`
- Border widths: `--border-thin/normal/thick`
- Transitions: `--transition-fast (150ms)`, `--normal (250ms)`, `--slow (400ms)`

### Z-index stack
`--z-base · -raised · -dropdown · -sticky · -fixed · -modal-backdrop · -modal · -tooltip`

## Utilities — cheat sheet

### Spacing — `p-{side}-{size}`, `m-{side}-{size}`, `gap-{size}`
```html
<!-- padding: --spacing-md; -->
<div class="p-md"></div>

<!-- padding: 0 var(--spacing-lg) -->
<div class="px-lg py-0"></div>

<!-- margin-top: var(--spacing-sm) -->
<div class="mt-sm"></div>

<!-- gap for flex/grid -->
<div class="d-flex gap-md"></div>
```
Sides: `t/r/b/l/x/y` or no suffix (all sides). Sizes: `0/xs/sm/md/lg/xl`.
Also: `m-auto`, `mx-auto`, `my-auto`.

### Flexbox
```html
<div class="d-flex flex-col gap-md items-center justify-between">…</div>
<div class="flex-center">…</div>      <!-- shortcut: flex + items + justify center -->
<div class="flex-between">…</div>     <!-- flex + space-between + items-center -->
<div class="flex-1 min-w-0">…</div>
```

### Display / Overflow
`d-block`, `d-inline-block`, `d-flex`, `d-inline-flex`, `d-grid`, `d-none`,
`overflow-hidden`, `overflow-y-auto`, `visible`, `invisible`.

### Sizing
`w-full`, `w-auto`, `w-fit`, `h-full`, `h-screen`, `min-w-0`, `min-h-0`,
`size-md` (32×32), `aspect-square`, `aspect-video`.

### Typography
`text-sm/base/lg/xl`, `font-heading/body`, `font-bold`, `font-semibold`,
`text-center/left/right`, `uppercase`, `tracking-wide`, `truncate`,
`leading-tight`, `whitespace-nowrap`, `break-word`.

### Colors
`text-primary/secondary/accent/dim/gold/danger/success`,
`bg-dark/medium/light/transparent`, `bg-accent-soft`,
`border-dark/gold/danger`.

### Borders
`border` (1px solid border-dark), `border-2`, `border-t/r/b/l`, `border-b-2`,
`rounded-sm/md/lg/full/circle`.

### Effects
`shadow-soft/medium/strong/glow/inset/none`,
`transition-fast/normal/slow`,
`opacity-0/25/40/55/70/100`.

### Position
`relative/absolute/fixed/sticky`, `inset-0`, `top-0`, `z-modal`, ...

### Interactivity
`cursor-pointer`, `cursor-not-allowed`, `pointer-events-none`,
`select-none`, `touch-none`.

## Component classes

### Button
```html
<!-- Base button -->
<button class="btn">Submit</button>

<!-- Variants -->
<button class="btn btn-primary">Confirm</button>
<button class="btn btn-secondary">Cancel</button>
<button class="btn btn-danger">Delete</button>
<button class="btn btn-ghost">Subtle</button>

<!-- Sizes -->
<button class="btn btn-sm">…</button>
<button class="btn btn-lg">…</button>

<!-- Icon-only (40×40) -->
<button class="btn btn-icon"><svg/></button>

<!-- Full width -->
<button class="btn btn-block">…</button>

<!-- States: :disabled and .active work automatically -->
<button class="btn active">Selected</button>
```

### Modal
```html
<!-- SkyrimModal wraps content in .modal-backdrop / .modal-panel / .modal-body -->
<div class="modal-content">
  <div class="modal-header">
    <h3 class="modal-title">Title</h3>
    <p class="modal-subtitle">Item name</p>
  </div>
  <p class="modal-message">Confirmation text</p>
  <div class="modal-actions">
    <button class="btn btn-danger">Yes</button>
    <button class="btn btn-secondary">No</button>
  </div>
</div>
```

### Panel / Card
```html
<div class="panel panel--elevated">…</div>
<div class="panel panel--accent">…</div>
<div class="card">Item</div>
<div class="card active">Selected item</div>
```

### Tabs
```html
<nav class="tab-bar">
  <button class="tab active">Inventory</button>
  <button class="tab">Magic</button>
</nav>

<nav class="subtab-bar">
  <button class="subtab active">Weapons</button>
  <button class="subtab">Apparel</button>
</nav>
```

### Input
```html
<input class="input" placeholder="…">
<div class="input-group"><!-- segmented control --></div>
```

### Badge
```html
<span class="badge badge--gold">8</span>
<span class="badge badge--dim badge--corner">L</span>
```

### List / Empty state
```html
<div class="list"> <!-- vertical, gap-sm -->
  <div class="list-divider">
    <span>Level</span><span>42</span>
  </div>
</div>

<div class="empty-state">No items</div>
```

## When to use what?

| Scenario | Solution |
|----------|----------|
| One-off layout (center once, add a single offset) | **Utilities** directly in the template (`d-flex gap-md`) |
| Pattern repeats across 3+ components | **Component class** (`button.scss`, ...) |
| Unique decoration (gradients, ornaments, transition animations) | **`<style scoped>`** in the `.vue` file itself |
| Color / size / font value | **Token** `var(--…)` |

## Animations

```html
<div class="animate-fade-in">…</div>
<div class="animate-slide-down">…</div>
<div class="animate-glow">…</div>
```

## Browser support

CSS nesting + custom properties: Chrome 120+, Firefox 117+, Safari 17.2+, Edge 120+.
For older browsers, the PostCSS plugin `postcss-preset-env` (stage 3) downgrades automatically.

---

# CSS Architecture - SkyrimWebMonitor

## CSS Structure

The project uses a modular approach to CSS with CSS nesting support for better organization and readability.

### Main CSS layers

1. **variables.css** — CSS variables (colors, sizes, fonts, spacing, transitions)
2. **base.css** — base styles (reset, html/body, scrolling)
3. **utilities.css** — utility classes (text, background, flexbox, gap)
4. **components.css** — component styles (tabs, panels, decorations)
5. **animations.css** — animations

The main file `skyrim-theme.css` imports all layers in the correct order.

### Component-specific styles

Every Vue component contains its own `<style scoped>` blocks with CSS nesting for better readability:

```vue
<style scoped>
.component-name {
  display: flex;
  gap: var(--spacing-md);

  &:hover {
    color: var(--skyrim-accent-gold);
  }

  & .child-element {
    font-size: var(--font-size-sm);
  }

  &.modifier {
    border-left: 3px solid var(--skyrim-accent-gold);
  }
}
</style>
```

## CSS Nesting syntax

### Nested selectors

```css
.parent {
  /* base styles */

  & .child {
    /* descendant styles */
  }

  &:hover {
    /* pseudo-classes */
  }

  &.is-active {
    /* modifiers */
  }
}
```

### Parent selector `&`

- `&` — reference to the parent selector
- `&:hover` — apply :hover to the parent
- `&.active` — apply a class to the parent
- `& .child` — nested selectors

## CSS variables

### Colors

```css
/* Main background colors */
--skyrim-bg-dark: #0d0d0d;
--skyrim-bg-medium: #1a1a1a;
--skyrim-bg-light: #252525;

/* Text colors */
--skyrim-text-primary: #d4c4a8;
--skyrim-text-secondary: #9a8b70;
--skyrim-text-accent: #f5e6c8;
--skyrim-text-dim: #5a5040;

/* Accent colors */
--skyrim-accent-gold: #c9a227;
--skyrim-accent-gold-light: #e5c44d;
--skyrim-accent-gold-dim: #8b7220;
```

### Sizes and spacing

```css
--spacing-xs: 0.25rem;    /* 4px */
--spacing-sm: 0.5rem;     /* 8px */
--spacing-md: 1rem;       /* 16px */
--spacing-lg: 1.5rem;     /* 24px */
--spacing-xl: 2rem;       /* 32px */

--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
```

### Transitions and effects

```css
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 400ms ease;

--glow-accent: 0 0 20px var(--skyrim-border-glow);
```

## Usage examples

### General utilities

```vue
<div class="flex flex-col gap-md items-center justify-center">
  <span class="text-primary">Text</span>
  <div class="bg-light shadow-soft">Panel</div>
</div>
```

### Component-specific styles

```vue
<template>
  <button class="skyrim-tab">Tab</button>
</template>

<style scoped>
.skyrim-tab {
  padding: 0 var(--spacing-lg);
  color: var(--tab-text-inactive);
  transition: all var(--transition-normal);

  &:hover {
    color: var(--tab-text-hover);
    background-color: var(--tab-bg-hover);
  }

  &.active {
    color: var(--tab-text-active);
    background-color: var(--tab-bg-active);
  }
}
</style>
```

## Recommendations

1. **Use variables** — do not hard-code colors or sizes
2. **CSS nesting** for nested selectors and states (:hover, :active, etc.)
3. **Scoped styles** — use the `scoped` attribute on Vue component `<style>` blocks
4. **Modularity** — keep component-specific styles inside the component
5. **Semantic class names** — use BEM or a similar approach

## Browser support for CSS Nesting

CSS nesting is supported in:

- Chrome 120+
- Firefox 117+
- Safari 17.2+
- Edge 120+

For older browsers, use PostCSS plugins or a compiler.
