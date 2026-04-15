<template>
  <inventory-list
    v-model="activeItem"
    :items="booksList"
    @favorite="toggleFavorite"
    @drop="startDrop"
    @item-double-click="useItem"
  >
    <template #default="{ item, active, onSelect }">
      <inventory-item
        v-if="isBookItem(item)"
        :name="item.name || $t('shared.ui.inventoryItem.unknown')"
        :is-favorite="item.isFavorite || false"
        :description="item.description || ''"
        :active="active"
        :quantity="item.count"
        @click="onSelect"
      />
    </template>
    <template #preview>
      <book-preview
        v-if="isBookItem(activeItemData)"
        :data="activeItemData"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { BookPreview } from '@/entities/ui';
import { InventoryList } from '@/features/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';
import { isBookItem } from '@/stores/adapters/typeGuards';
import { InventoryItem } from '@/shared/ui/items';

const inventoryStore = useInventoryStore();
const { booksList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();

const { activeItem, activeItemData, toggleFavorite, startDrop } = useInventoryItemActions(
  () => booksList.value
);

function useItem(formId: string) {
  const item = booksList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Use (open/read) the book item
  wsStore.sendCommand('use', formId);
}
</script>

<style scoped lang="scss">
// Component uses InventoryList styles
</style>
