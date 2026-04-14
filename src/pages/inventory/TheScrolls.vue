<template>
  <inventory-list
    v-model="activeItem"
    :items="scrollsList"
    @favorite="toggleFavorite"
    @drop="startDrop"
    @item-double-click="useItem"
  >
    <template #default="{ item, active, onSelect }">
      <scroll-item
        :name="item.name || $t('shared.ui.inventoryItem.unknown')"
        :is-favorite="item.isFavorite || false"
        :active="active"
        :quantity="item.count"
        @click="onSelect"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ScrollItem } from '@/entities/ui';
import { InventoryList } from '@/features/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';

const inventoryStore = useInventoryStore();
const { scrollsList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();

const { activeItem, toggleFavorite, startDrop } = useInventoryItemActions(
  () => scrollsList.value
);

function useItem(formId: string) {
  const item = scrollsList.value.find(f => f.formId === formId);
  if (!item) return;

  // Use the scroll
  wsStore.sendCommand('use', formId);
}
</script>

<style scoped lang="scss">
// Component uses InventoryList styles
</style>
