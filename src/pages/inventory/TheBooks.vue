<template>
  <inventory-list
    v-model="activeItem"
    :items="booksList"
    :active-item="activeItemData"
    :active-item-stats="previewStats"
    preview-icon-path="lorc/open-book.svg"
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

const inventoryStore = useInventoryStore();
const { booksList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();
const { t } = useI18n();

const { activeItem, activeItemData, toggleFavorite, openHotkeyPicker, startDrop } =
  useInventoryItemActions(() => booksList.value);

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

function useItem(formId: string) {
  const item = booksList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Use (open/read) the book item
  wsStore.sendCommand({ command: 'use', formId });
}
</script>

<style scoped lang="scss">
// Component uses InventoryList styles
</style>
