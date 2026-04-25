# Дизайн-система SkyrimWebMonitor

Bootstrap-подобная атомарная дизайн-система с темой Skyrim.
Главная точка входа — `skyrim-theme.scss` (импортируется один раз в [src/main.js](../../../main.js)).

## Структура

```
styles/
├── skyrim-theme.scss      # entry — порядок слоёв
├── variables.scss         # design-токены (цвета, spacing, typography, z-index, ...)
├── base.scss              # reset, body, scrollbars
├── animations.scss        # keyframes + .animate-* помощники
├── utilities/             # атомарные утилиты (Bootstrap-style)
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
└── components/            # переиспользуемые UI-классы
    ├── _index.scss
    ├── button.scss        # .btn, .btn-primary/secondary/danger/ghost/icon, .btn-sm/lg/block
    ├── modal.scss         # .modal-backdrop, .modal-panel, .modal-content/header/title/actions
    ├── panel.scss         # .panel, .panel--elevated/accent/danger, .card
    ├── badge.scss         # .badge, .badge--gold/dim/danger/corner
    ├── input.scss         # .input, .input-group
    ├── tabs.scss          # .tab-bar, .tab, .subtab-bar, .subtab
    └── list.scss          # .list, .list--md, .list-divider, .empty-state, .no-data
```

## 5 слоёв CSS (порядок важен)

| # | Слой | Назначение |
|---|------|-----------|
| 1 | **variables** | CSS-переменные (токены) |
| 2 | **base** | Сброс, теги, скроллбары |
| 3 | **utilities** | Атомарные классы (низкая специфичность) |
| 4 | **components** | Готовые UI-блоки (`.btn`, `.modal-*`, `.tab`, ...) |
| 5 | **animations** | Глобальные `@keyframes` + хелперы `.animate-*` |

## Принципы

1. **Сначала утилиты, затем компонентные классы.** Если дизайн повторяется ≥ 3 раз — вынесите его в `components/`.
2. **Стили конкретного компонента остаются в нём** (внутри `<style scoped>`).
   В `components/` попадают только переиспользуемые паттерны.
3. **Никаких хардкод-значений.** Используйте токены из `variables.scss`.
4. **CSS-переменные, а не SCSS-переменные** для значений, доступных в рантайме (цвета, размеры).
5. **`@use` модули, без `@import`.**

## Дизайн-токены (`variables.scss`)

### Spacing
`--spacing-xs (4px)` · `sm (8px)` · `md (16px)` · `lg (24px)` · `xl (32px)`

### Размеры (для квадратных элементов / иконок)
`--size-xs (16)` · `sm (24)` · `md (32)` · `lg (40)` · `xl (48)` · `2xl (64)`

### Типографика
- `--font-heading: 'Cinzel', serif` — заголовки, кнопки
- `--font-body: 'Cormorant Garamond', serif` — основной текст
- `--font-size-xs/sm/base/lg/xl`

### Цвета
- Фон: `--skyrim-bg-dark/medium/light`
- Текст: `--skyrim-text-primary/secondary/accent/dim`
- Акцент: `--skyrim-accent-gold/-light/-dim`
- Семантика: `--color-success`, `--color-danger`, `--color-warning`
- Транспарентные подложки: `--bg-accent-faint/-soft/-medium/-strong`

### Эффекты
- Тени: `--shadow-soft/medium/strong`, `--glow-accent`, `--bg-inset-dark`
- Радиусы: `--radius-sm/md/lg`
- Толщина рамки: `--border-thin/normal/thick`
- Переходы: `--transition-fast (150ms)`, `--normal (250ms)`, `--slow (400ms)`

### Z-index стек
`--z-base · -raised · -dropdown · -sticky · -fixed · -modal-backdrop · -modal · -tooltip`

## Утилиты — шпаргалка

### Spacing — `p-{side}-{size}`, `m-{side}-{size}`, `gap-{size}`
```html
<!-- padding: --spacing-md; -->
<div class="p-md"></div>

<!-- padding: 0 var(--spacing-lg) -->
<div class="px-lg py-0"></div>

<!-- margin-top: var(--spacing-sm) -->
<div class="mt-sm"></div>

<!-- gap для flex/grid -->
<div class="d-flex gap-md"></div>
```
Стороны: `t/r/b/l/x/y` или без суффикса (со всех сторон). Размеры: `0/xs/sm/md/lg/xl`.
Также: `m-auto`, `mx-auto`, `my-auto`.

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

## Компонентные классы

### Button
```html
<!-- Базовая кнопка -->
<button class="btn">Submit</button>

<!-- Варианты -->
<button class="btn btn-primary">Confirm</button>
<button class="btn btn-secondary">Cancel</button>
<button class="btn btn-danger">Delete</button>
<button class="btn btn-ghost">Subtle</button>

<!-- Размеры -->
<button class="btn btn-sm">…</button>
<button class="btn btn-lg">…</button>

<!-- Иконочная (40×40) -->
<button class="btn btn-icon"><svg/></button>

<!-- На всю ширину -->
<button class="btn btn-block">…</button>

<!-- Состояния: :disabled и .active работают автоматически -->
<button class="btn active">Selected</button>
```

### Modal
```html
<!-- SkyrimModal оборачивает контент в .modal-backdrop / .modal-panel / .modal-body -->
<div class="modal-content">
  <div class="modal-header">
    <h3 class="modal-title">Заголовок</h3>
    <p class="modal-subtitle">Item name</p>
  </div>
  <p class="modal-message">Текст подтверждения</p>
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

## Когда что использовать?

| Сценарий | Решение |
|---------|--------|
| Однократный layout (центрировать раз, добавить отступ раз) | **Утилиты** прямо в шаблоне (`d-flex gap-md`) |
| Паттерн повторяется в 3+ компонентах | **Компонентный класс** (`button.scss`, ...) |
| Уникальная декорация (градиент шкалы, орнаменты, анимации перехода) | **`<style scoped>`** в самом `.vue` |
| Цвет / размер / шрифт | **Токен** `var(--…)` |

## Анимации

```html
<div class="animate-fade-in">…</div>
<div class="animate-slide-down">…</div>
<div class="animate-glow">…</div>
```

## Поддержка браузерами

CSS nesting + custom properties: Chrome 120+, Firefox 117+, Safari 17.2+, Edge 120+.
Для остального PostCSS-плагин `postcss-preset-env` (stage 3) автоматически даунгрейдит.
# CSS Architecture - SkyrimWebMonitor

## Структура CSS

Проект использует модульный подход к CSS с поддержкой CSS nesting для лучшей организации и читаемости.

### Основные слои CSS

1. **variables.css** - CSS переменные (цвета, размеры, шрифты, расстояния, переходы)
2. **base.css** - Базовые стили (сброс, html/body, прокрутка)
3. **utilities.css** - Служебные классы (текст, фон, flexbox, gap)
4. **components.css** - Стили компонентов (табы, панели, украшения)
5. **animations.css** - Анимации

Главный файл `skyrim-theme.css` импортирует все слои в правильном порядке.

### Компонент-специфичные стили

Каждый Vue компонент содержит свои `<style scoped>` блоки с CSS nesting для улучшения читаемости:

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

## CSS Nesting Синтаксис

### Вложенные селекторы

```css
.parent {
  /* базовые стили */

  & .child {
    /* стили для потомков */
  }

  &:hover {
    /* pseudo-классы */
  }

  &.is-active {
    /* модификаторы */
  }
}
```

### Родительский селектор `&`

- `&` - ссылка на родительский селектор
- `&:hover` - применить :hover к родителю
- `&.active` - применить класс к родителю
- `& .child` - вложенные селекторы

## Переменные CSS

### Цвета

```css
/* Основные цвета фона */
--skyrim-bg-dark: #0d0d0d;
--skyrim-bg-medium: #1a1a1a;
--skyrim-bg-light: #252525;

/* Цвета текста */
--skyrim-text-primary: #d4c4a8;
--skyrim-text-secondary: #9a8b70;
--skyrim-text-accent: #f5e6c8;
--skyrim-text-dim: #5a5040;

/* Акцентные цвета */
--skyrim-accent-gold: #c9a227;
--skyrim-accent-gold-light: #e5c44d;
--skyrim-accent-gold-dim: #8b7220;
```

### Размеры и расстояния

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

### Переходы и эффекты

```css
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 400ms ease;

--glow-accent: 0 0 20px var(--skyrim-border-glow);
```

## Примеры использования

### Общие утилиты

```vue
<div class="flex flex-col gap-md items-center justify-center">
  <span class="text-primary">Текст</span>
  <div class="bg-light shadow-soft">Панель</div>
</div>
```

### Компонент-специфичные стили

```vue
<template>
  <button class="skyrim-tab">Вкладка</button>
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

## Рекомендации

1. **Используйте переменные** - не хардкодьте цвета или размеры
2. **CSS nesting** для вложенных селекторов и состояний (:hover, :active, etc.)
3. **Scoped styles** - используйте `scoped` атрибут в `<style>` Vue компонентов
4. **Модульность** - держите специфичные стили компонента в компоненте
5. **Семантические имена классов** - используйте BEM или похожий подход

## Поддержка браузерами CSS Nesting

CSS nesting поддерживается в:
- Chrome 120+
- Firefox 117+
- Safari 17.2+
- Edge 120+

Для более старых браузеров используйте postCSS плагины или компилятор.
