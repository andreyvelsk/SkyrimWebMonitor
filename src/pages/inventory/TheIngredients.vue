<template>
  <inventory-list
    v-model="activeItem"
    :items="ingredientsList"
    @favorite="toggleFavorite"
    @drop="startDrop"
    @item-double-click="useItem"
  >
    <template #default="{ item, active, onSelect }">
      <ingredient-item
        :name="item.name || $t('shared.ui.inventoryItem.unknown')"
        :is-favorite="item.isFavorite || false"
        :active="active"
        :quantity="item.count"
        @click="onSelect"
      />
    </template>
    <template #preview>
      <ingredient-preview
        v-if="isIngredientItem(activeItemData)"
        :data="activeItemData"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { IngredientItem, IngredientPreview } from '@/entities/ui';
import { isIngredientItem } from '@/stores/adapters/typeGuards';
import { InventoryList } from '@/features/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';

const inventoryStore = useInventoryStore();
const { ingredientsList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();

const { activeItem, activeItemData, toggleFavorite, startDrop } = useInventoryItemActions(
  () => ingredientsList.value
);

function useItem(formId: string) {
  const item = ingredientsList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Use (consume) the ingredient item
  wsStore.sendCommand('use', formId);
}
</script>

<style scoped lang="scss">
// Component uses InventoryList styles
</style>
