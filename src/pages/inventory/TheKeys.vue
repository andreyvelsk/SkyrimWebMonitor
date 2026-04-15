<template>
  <inventory-list
    v-model="activeItem"
    :items="keysList"
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
      <key-preview
        v-if="isKeyItem(activeItemData)"
        :data="activeItemData"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { KeyPreview } from '@/entities/ui';
import { InventoryList } from '@/features/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';
import { InventoryItem } from '@/shared/ui/items';
import { isKeyItem } from '@/stores/adapters/typeGuards';

const inventoryStore = useInventoryStore();
const { keysList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();

const { activeItem, activeItemData, toggleFavorite, startDrop } = useInventoryItemActions(
  () => keysList.value
);

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
