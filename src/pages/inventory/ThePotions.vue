<template>
  <inventory-list
    v-model="activeItem"
    :items="potionsList"
    :active-item="activeItemData"
    :active-item-stats="previewStats"
    :preview-effects="previewEffects"
    preview-icon-path="lorc/potion-ball.svg"
    @favorite="toggleFavorite"
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
import { isPotionItem } from '@/stores/adapters/typeGuards';

const inventoryStore = useInventoryStore();
const { potionsList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();
const { t } = useI18n();

const { activeItem, activeItemData, toggleFavorite, startDrop } =
  useInventoryItemActions(() => potionsList.value);

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
  if (!isPotionItem(activeItemData.value)) return [];
  return activeItemData.value?.effects || [];
});

function useItem(formId: string) {
  const item = potionsList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Use (consume) the potion
  wsStore.sendCommand('use', formId);
}
</script>
