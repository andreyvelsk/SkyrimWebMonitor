<template>
  <section class="panel">
    <h3 class="modal-title text-base m-0">{{ t('app.settings.gfxIcons.title') }}</h3>
    <template v-if="isFileDownloadProvided">
      <div class="d-flex items-center justify-between gap-md">
        <span class="text-sm">{{ t('app.settings.gfxIcons.disableGfxIcons') }}</span>
        <base-switch
          :model-value="gfxIconsDisabled"
          :aria-label="t('app.settings.gfxIcons.disableGfxIcons')"
          @update:model-value="persistGfxIconsDisabled"
        />
      </div>
      <div>
        <button
          type="button"
          class="btn self-start"
          :disabled="isLoading"
          @click="reloadIcons"
        >
          <span v-if="isLoading">{{ t('app.settings.gfxIcons.reloading') }}</span>
          <span v-else>{{ t('app.settings.gfxIcons.reload') }}</span>
        </button>
        <p class="text-sm text-secondary m-0">{{ t('app.settings.gfxIcons.hint') }}</p>

        <p
          v-if="error"
          class="text-sm text-danger m-0"
        >
          {{ error }}
        </p>
      </div>
    </template>
    <p
      v-else
      class="text-sm text-secondary m-0"
    >
      {{ t('app.settings.updateDll') }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { BaseSwitch } from '@/shared/ui';
import { gfxIconsDisabled, persistGfxIconsDisabled } from '@/shared/lib';
import { useGfxIconsLoader } from '@/features/gfx-icons';
import { useGfxIconsStore } from '@/stores/gfx-icons/useGfxIconsStore';
import { useSystemStore } from '@/stores/system/useSystemStore';
import { FEATURES } from '@/stores/system/lib/types';

const { t } = useI18n();
const { reinitialize } = useGfxIconsLoader();
const gfxIconsStore = useGfxIconsStore();
const { isLoading, error } = storeToRefs(gfxIconsStore);
const systemStore = useSystemStore();
const isFileDownloadProvided = systemStore.isFeatureProvided(FEATURES.FILE_DOWNLOAD);

async function reloadIcons(): Promise<void> {
  await reinitialize();
}
</script>