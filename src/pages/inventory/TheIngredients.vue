<template>
  <inventory-list
    v-model="activeItem"
    :items="ingredientsList"
    :active-item="activeItemData"
    :active-item-stats="previewStats"
    preview-icon-path="skoll/pestle-mortar.svg"
    @favorite="toggleFavorite"
    @drop="startDrop"
    @item-double-click="useItem"
  >
    <template #preview>
      <ingredient-preview
        v-if="isIngredientItem(activeItemData)"
        :data="activeItemData"
      />
    </template>
  </inventory-list>
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
import { IngredientPreview } from '@/entities/ui/ingredients';
import { isIngredientItem } from '@/stores/adapters/typeGuards';

const inventoryStore = useInventoryStore();
const { ingredientsList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();
const { t } = useI18n();

const { activeItem, activeItemData, toggleFavorite, startDrop } =
  useInventoryItemActions(() => ingredientsList.value);

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
  const item = ingredientsList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Use (consume) the ingredient item
  wsStore.sendCommand('use', formId);
}
</script>

<style scoped lang="scss">
// Component uses InventoryList styles
</style>
