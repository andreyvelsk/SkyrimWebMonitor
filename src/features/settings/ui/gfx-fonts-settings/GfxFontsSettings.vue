<template>
  <section class="panel">
    <h3 class="modal-title text-base m-0">{{ t('app.settings.gfxFonts.title') }}</h3>
    <div class="d-flex items-center justify-between gap-md">
      <span class="text-sm">{{ t('app.settings.gfxFonts.disableGfxFonts') }}</span>
      <base-switch
        :model-value="gfxFontsDisabled"
        :aria-label="t('app.settings.gfxFonts.disableGfxFonts')"
        @update:model-value="persistGfxFontsDisabled"
      />
    </div>
    <div>
      <button
        type="button"
        class="btn self-start"
        :disabled="isLoading"
        @click="reloadFonts"
      >
        <span v-if="isLoading">{{ t('app.settings.gfxFonts.reloading') }}</span>
        <span v-else>{{ t('app.settings.gfxFonts.reload') }}</span>
      </button>
      <p class="text-sm text-secondary m-0">{{ t('app.settings.gfxFonts.hint') }}</p>

      <p
        v-if="error"
        class="text-sm text-danger m-0"
      >
        {{ error }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { BaseSwitch } from '@/shared/ui';
import { gfxFontsDisabled, persistGfxFontsDisabled } from '@/shared/lib';
import { useGfxFontsLoader } from '@/features/gfx-fonts';
import { useGfxFontsStore } from '@/stores/gfx-fonts/useGfxFontsStore';

const { t } = useI18n();
const { reinitialize } = useGfxFontsLoader();
const gfxFontsStore = useGfxFontsStore();
const { isLoading, error } = storeToRefs(gfxFontsStore);

async function reloadFonts(): Promise<void> {
  await reinitialize();
}
</script>