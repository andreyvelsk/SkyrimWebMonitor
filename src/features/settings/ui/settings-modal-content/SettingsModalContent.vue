<template>
  <div class="settings-modal-content modal-content">
    <theme-gamut-picker />
    <section class="settings-modal-content__section">
      <h3 class="settings-modal-content__title">{{ t('app.settings.gfxIcons.title') }}</h3>
      <p class="settings-modal-content__hint">{{ t('app.settings.gfxIcons.hint') }}</p>
      <button
        type="button"
        class="settings-modal-content__btn"
        :disabled="isLoading"
        @click="reloadIcons"
      >
        <span v-if="isLoading">{{ t('app.settings.gfxIcons.reloading') }}</span>
        <span v-else>{{ t('app.settings.gfxIcons.reload') }}</span>
      </button>
      <p
        v-if="error"
        class="settings-modal-content__error"
      >
        {{ error }}
      </p>
    </section>
    <display-controls :teleport="false" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { DisplayControls } from '@/shared/ui';
import { useGfxIconsLoader } from '@/features/gfx-icons';
import { useGfxIconsStore } from '@/stores/gfx-icons/useGfxIconsStore';
import ThemeGamutPicker from '../theme-gamut-picker/ThemeGamutPicker.vue';

const { t } = useI18n();
const { reinitialize } = useGfxIconsLoader();
const gfxIconsStore = useGfxIconsStore();
const { isLoading, error } = storeToRefs(gfxIconsStore);

async function reloadIcons(): Promise<void> {
  await reinitialize();
}
</script>

<style scoped lang="scss">
.settings-modal-content__section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.settings-modal-content__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--skyrim-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.settings-modal-content__hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-secondary);
  line-height: 1.4;
}

.settings-modal-content__btn {
  align-self: flex-start;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-accent-soft);
  border: 1px solid var(--skyrim-border-dark);
  border-radius: var(--radius-md);
  color: var(--skyrim-text-primary);
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);

  @media (hover: hover) {
    &:hover:not(:disabled) {
      border-color: var(--skyrim-accent-main-dim);
      background-color: var(--bg-accent-faint);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.settings-modal-content__error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--skyrim-danger);
}
</style>
