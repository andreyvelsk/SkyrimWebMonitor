# CSS Структура - Быстрый старт

## Где находятся стили?

### Глобальные стили
📁 `/src/shared/lib/styles/` - все стили в одном месте

- 🎨 **variables.css** - переменные (цвета, размеры, фонты)
- 📄 **base.css** - базовые стили
- 🧰 **utilities.css** - вспомогательные классы
- 🎭 **components.css** - стили компонентов (табы, панели)
- ✨ **animations.css** - анимации

### Компонент-специфичные стили
В каждом `.vue` файле в блоке `<style scoped>`:

```vue
<style scoped>
.component-name {
  /* Стили только для этого компонента */
}
</style>
```

## Использование CSS Nesting

### ✅ Правильно

```css
.card {
  padding: var(--spacing-md);
  background: var(--skyrim-bg-light);

  &:hover {
    background: var(--skyrim-bg-medium);
  }

  & .title {
    color: var(--skyrim-text-primary);
  }

  &.active {
    border: 1px solid var(--skyrim-accent-gold);
  }
}
```

### ❌ Неправильно

```css
.card {
  padding: var(--spacing-md);
}

.card:hover {
  background: #ddd;  /* ❌ не использован переменные */
}

.card .title {
  color: #999;  /* ❌ не использован переменные */
}
```

## Доступные переменные

### Цвета 🎨

```css
--skyrim-text-primary      /* Основной текст */
--skyrim-text-secondary    /* Вторичный текст */
--skyrim-text-accent       /* Акцентный текст */
--skyrim-text-dim          /* Неактивный текст */

--skyrim-bg-dark           /* Темный фон */
--skyrim-bg-medium         /* Средний фон */
--skyrim-bg-light          /* Светлый фон */

--skyrim-accent-gold       /* Основной золотой цвет */
--skyrim-accent-gold-light /* Светлый золотой */
--skyrim-accent-gold-dim   /* Тусклый золотой */

--skyrim-border-dark       /* Темная граница */
--skyrim-border-accent     /* Акцентная граница */
```

### Размеры 📏

```css
--spacing-xs    /* 4px */
--spacing-sm    /* 8px */
--spacing-md    /* 16px */
--spacing-lg    /* 24px */
--spacing-xl    /* 32px */

--font-size-xs   /* 12px */
--font-size-sm   /* 14px */
--font-size-base /* 16px */
--font-size-lg   /* 18px */
--font-size-xl   /* 20px */

--radius-sm      /* 2px */
--radius-md      /* 4px */
--radius-lg      /* 8px */
```

### Переходы ⚡

```css
--transition-fast   /* 150ms ease */
--transition-normal /* 250ms ease */
--transition-slow   /* 400ms ease */
```

## Утилиты

### Flexbox

```html
<div class="flex flex-col gap-md items-center justify-center">
  Хибкое расположение
</div>
```

### Тексты

```html
<span class="text-primary">Основной текст</span>
<span class="text-secondary">Вторичный текст</span>
<span class="text-accent">Акцентный текст</span>
<span class="text-dim">Неактивный текст</span>
<span class="text-gold">Золотой текст</span>
```

### Фоны

```html
<div class="bg-dark">Самый темный фон</div>
<div class="bg-medium">Средний фон</div>
<div class="bg-light">Светлый фон</div>
```

### Тени

```html
<div class="shadow-soft">Легкая тень</div>
<div class="shadow-medium">Средняя тень</div>
<div class="shadow-strong">Сильная тень</div>
```

## Примеры компонентов

### Кнопка

```vue
<template>
  <button class="skyrim-button">Текст</button>
</template>

<style scoped>
.skyrim-button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--skyrim-bg-light);
  color: var(--skyrim-text-primary);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--skyrim-accent-gold-dim);
    background-color: rgb(201 162 39 / 8%);
  }

  &:active {
    border-color: var(--skyrim-accent-gold);
  }
}
</style>
```

### Карточка

```vue
<template>
  <div class="card">
    <h3 class="card-title">Заголовок</h3>
    <p class="card-description">Описание</p>
  </div>
</template>

<style scoped>
.card {
  background-color: var(--skyrim-bg-medium);
  border: 1px solid var(--skyrim-border-dark);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);

  & .card-title {
    font-family: var(--font-heading);
    color: var(--skyrim-text-accent);
    margin-bottom: var(--spacing-sm);
  }

  & .card-description {
    color: var(--skyrim-text-secondary);
    font-size: var(--font-size-sm);
  }

  &:hover {
    border-color: var(--skyrim-accent-gold-dim);
  }
}
</style>
```

## Проверка

Все стили автоматически обрабатываются PostCSS, поэтому вам не нужно ничего делать - просто пишите CSS как обычно!

CSS nesting работает:
- ✅ В Vue компонентах `<style scoped>`
- ✅ В CSS файлах в `/src/shared/lib/styles/`
- ✅ Автоматически преобразуется в совместимый CSS

## Нужна помощь?

📖 Подробная документация: `/src/shared/lib/styles/README.md`
🎨 Кастомизация: Измените переменные в `/src/shared/lib/styles/variables.css`
⚙️ Конфигурация: `/postcss.config.js`
