<template>
  <inventory-list
    v-model="activeItem"
    :items="foodList"
    :active-item="activeItemData"
    :active-item-stats="previewStats"
    preview-icon-path="lorc/shiny-apple.svg"
    :preview-effects="previewEffects"
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
import { isFoodItem } from '@/stores/adapters/typeGuards';

const inventoryStore = useInventoryStore();
const { foodList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();
const { t } = useI18n();

const {
  activeItem,
  activeItemData,
  toggleFavorite,
  openHotkeyPicker,
  startDrop,
} = useInventoryItemActions(() => foodList.value);

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
  if (!isFoodItem(activeItemData.value)) return [];
  return activeItemData.value?.effects || [];
});

function useItem(formId: string) {
  const item = foodList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Use (consume) the food item
  wsStore.sendCommand({ command: 'use', formId });
}
</script>

<style scoped lang="scss">
// Component uses InventoryList styles
</style>
