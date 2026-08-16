<template>
  <section class="d-flex flex-col gap-md">
    <h3 class="modal-title text-base m-0">{{ t('app.settings.theme.title') }}</h3>
    <div
      class="d-flex gap-md flex-wrap"
      role="radiogroup"
      :aria-label="t('app.settings.theme.title')"
    >
      <button
        v-for="gamut in gamuts"
        :key="gamut.id"
        type="button"
        class="card bg-transparent p-sm d-flex flex-col items-center gap-xs"
        :class="{ active: gamut.id === currentThemeGamutId }"
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
