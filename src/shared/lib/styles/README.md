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
