<template>
  <section class="panel">
    <h3 class="modal-title text-base m-0">{{ t('app.settings.itemThumbnails.title') }}</h3>
    <template v-if="isModelsProvided">
      <div class="d-flex items-center justify-between gap-md">
        <span class="text-sm">{{ t('app.settings.itemThumbnails.disable') }}</span>
        <base-switch
          :model-value="itemThumbnailsDisabled"
          :aria-label="t('app.settings.itemThumbnails.disable')"
          @update:model-value="persistItemThumbnailsDisabled"
        />
      </div>
      <div class="d-flex flex-col gap-sm">
        <button
          type="button"
          class="btn self-start"
          :disabled="isPrefetching || !isConnected"
          @click="prefetch"
        >
          {{ t('app.settings.itemThumbnails.prefetch') }}
        </button>
        <p class="text-sm text-secondary m-0">
          <template v-if="pendingCount > 0">
            {{ t('app.settings.itemThumbnails.prefetchProgress', { count: pendingCount }) }}
          </template>
          <template v-else-if="prefetchTotal !== null">
            {{ t('app.settings.itemThumbnails.prefetchDone', { count: prefetchTotal }) }}
          </template>
          <template v-else>
            {{ t('app.settings.itemThumbnails.prefetchHint') }}
          </template>
        </p>
      </div>
      <div>
        <button
          type="button"
          class="btn self-start"
          :disabled="isClearing"
          @click="clearCache"
        >
          <span v-if="isClearing">{{ t('app.settings.itemThumbnails.clearing') }}</span>
          <span v-else>{{ t('app.settings.itemThumbnails.clear') }}</span>
        </button>
        <p class="text-sm text-secondary m-0">{{ t('app.settings.itemThumbnails.hint') }}</p>
        <p class="text-sm text-secondary m-0">
          {{ t('app.settings.itemThumbnails.count', { count: generatedCount }) }}
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
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { BaseSwitch } from '@/shared/ui';
import { itemThumbnailsDisabled, persistItemThumbnailsDisabled } from '@/shared/lib';
import { useItemThumbnailsStore } from '@/stores/item-thumbnails/useItemThumbnailsStore';
import { useSystemStore } from '@/stores/system/useSystemStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { FEATURES } from '@/stores/system/lib/types';

const { t } = useI18n();
const thumbnailsStore = useItemThumbnailsStore();
const { generatedCount, pendingCount } = storeToRefs(thumbnailsStore);
const { isConnected } = storeToRefs(useWebSocketStore());
const isPrefetching = ref(false);
const prefetchTotal = ref<number | null>(null);

async function prefetch(): Promise<void> {
  isPrefetching.value = true;
  try {
    prefetchTotal.value = await thumbnailsStore.prefetchInventory();
  } finally {
    isPrefetching.value = false;
  }
}
const systemStore = useSystemStore();
const isModelsProvided = computed(() => systemStore.isFeatureProvided(FEATURES.INVENTORY_MODELS));
const isClearing = ref(false);

async function clearCache(): Promise<void> {
  isClearing.value = true;
  try {
    await thumbnailsStore.clearCache();
  } finally {
    isClearing.value = false;
  }
}
</script>
