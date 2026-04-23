<template>
  <inventory-list
    v-model="activeItem"
    :items="scrollsList"
    :active-item="activeItemData"
    :active-item-stats="previewStats"
    :preview-effects="previewEffects"
    preview-icon-path="lorc/tied-scroll.svg"
    @favorite="toggleFavorite"
    @hotkey="openHotkeyPicker"
    @drop="startDrop"
    @item-double-click="useItem"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { InventoryList } from '@/features/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';
import { getRoundValue } from '@/shared/lib/utils/getDescriptionValues';
import { isScrollItem } from '@/stores/adapters/typeGuards';

const inventoryStore = useInventoryStore();
const { scrollsList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();
const { t } = useI18n();

const { activeItem, activeItemData, toggleFavorite, openHotkeyPicker, startDrop } =
  useInventoryItemActions(() => scrollsList.value);

const previewStats = computed(() => [
  {
    label: t('common.weight'),
    value: getRoundValue(activeItemData.value?.weight),
  },
  {
    label: t('common.value'),
    value: getRoundValue(activeItemData.value?.value),
  },
]);

const previewEffects = computed(() => {
  if (!isScrollItem(activeItemData.value)) return [];
  return activeItemData.value?.effects || [];
});

function useItem(formId: string) {
  const item = scrollsList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Use the scroll
  wsStore.sendCommand({ command: 'use', formId });
}
</script>

<style scoped lang="scss">
// Component uses InventoryList styles
</style>
