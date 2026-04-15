<template>
  <inventory-list
    v-model="activeItem"
    :items="potionsList"
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
  </inventory-list>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { InventoryItem } from '@/shared/ui/items/';
import { InventoryList } from '@/features/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';

const inventoryStore = useInventoryStore();
const { potionsList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();

const { activeItem, toggleFavorite, startDrop } = useInventoryItemActions(
  () => potionsList.value
);

function useItem(formId: string) {
  const item = potionsList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Use (consume) the potion
  wsStore.sendCommand('use', formId);
}
</script>
