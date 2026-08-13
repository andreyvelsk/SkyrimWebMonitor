<template>
  <section class="theme-gamut-picker">
    <h3 class="theme-gamut-picker__title">{{ t('app.settings.theme.title') }}</h3>
    <div
      class="theme-gamut-picker__options"
      role="radiogroup"
      :aria-label="t('app.settings.theme.title')"
    >
      <button
        v-for="gamut in gamuts"
        :key="gamut.id"
        type="button"
        class="theme-gamut-picker__option"
        :class="{ 'theme-gamut-picker__option--active': gamut.id === currentThemeGamutId }"
        role="radio"
        :aria-checked="gamut.id === currentThemeGamutId"
        :title="t(gamut.labelKey)"
        @click="selectGamut(gamut.id)"
      >
        <span
          class="theme-gamut-picker__swatch"
          :class="`theme-gamut-picker__swatch--${gamut.id}`"
        />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { THEME_GAMUTS, currentThemeGamutId, applyThemeGamut } from '@/shared/lib';

const { t } = useI18n();
const gamuts = THEME_GAMUTS;

function selectGamut(id: string): void {
  applyThemeGamut(id);
}
</script>

<style scoped lang="scss">
.theme-gamut-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.theme-gamut-picker__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--skyrim-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.theme-gamut-picker__options {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.theme-gamut-picker__option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: none;
  border: 1px solid var(--skyrim-border-dark);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);

  @media (hover: hover) {
    &:hover {
      border-color: var(--skyrim-accent-main-dim);
      background-color: var(--bg-accent-faint);
    }
  }

  &--active {
    border-color: var(--skyrim-accent-main);
    background-color: var(--bg-accent-soft);
  }
}

.theme-gamut-picker__swatch {
  display: block;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--skyrim-accent-main);
  box-shadow: 0 0 8px rgb(0 0 0 / 30%);

  &--silver {
    background-color: var(--gamut-swatch-silver);
  }

  &--gold {
    background-color: var(--gamut-swatch-gold);
  }
}
</style>
