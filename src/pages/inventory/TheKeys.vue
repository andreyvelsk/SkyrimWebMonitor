<template>
  <inventory-list
    v-model="activeItem"
    :items="keysList"
    :active-item="activeItemData"
    :active-item-stats="previewStats"
    preview-icon-path="lorc/key.svg"
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
const { keysList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();
const { t } = useI18n();

const { activeItem, activeItemData, toggleFavorite, openHotkeyPicker, startDrop } =
  useInventoryItemActions(() => keysList.value);

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
  const item = keysList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Keys generally cannot be "used" like consumables; still send a generic use command
  wsStore.sendCommand('use', formId);
}
</script>

<style scoped lang="scss">
// Component uses InventoryList styles
</style>
