<template>
  <inventory-list
    v-model="activeItem"
    :items="foodList"
    @favorite="toggleFavorite"
    @drop="startDrop"
    @item-double-click="useItem"
  >
    <template #default="{ item, active, onSelect }">
      <inventory-item
        :name="item.name || $t('shared.ui.inventoryItem.unknown')"
        :is-favorite="item.isFavorite || false"
        :active="active"
        :quantity="item.count"
        @click="onSelect"
      />
    </template>
    <template #preview>
      <food-preview
        v-if="isFoodItem(activeItemData)"
        :data="activeItemData"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { InventoryItem } from '@/shared/ui/items/';
import { FoodPreview } from '@/entities/ui';
import { isFoodItem } from '@/stores/adapters/typeGuards';
import { InventoryList } from '@/features/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';

const inventoryStore = useInventoryStore();
const { foodList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();

const { activeItem, activeItemData, toggleFavorite, startDrop } = useInventoryItemActions(
  () => foodList.value
);

function useItem(formId: string) {
  const item = foodList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Use (consume) the food item
  wsStore.sendCommand('use', formId);
}
</script>

<style scoped lang="scss">
// Component uses InventoryList styles
</style>
