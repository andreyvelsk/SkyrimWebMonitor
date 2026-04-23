<template>
  <inventory-list
    v-model="activeItem"
    :items="miscList"
    @favorite="toggleFavorite"
    @hotkey="openHotkeyPicker"
    @drop="startDrop"
    @item-double-click="useItem"
  >
    <template #preview>
      <gem-preview
        v-if="isGem(activeItemData)"
        :data="activeItemData"
      />

      <misc-preview
        v-else-if="isMiscItem(activeItemData)"
        :data="activeItemData"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { MiscPreview, GemPreview } from '@/entities/ui';
import { isGem, isMiscItem } from '@/stores/adapters/typeGuards';
import { InventoryList } from '@/features/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';

const inventoryStore = useInventoryStore();
const { miscList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();

const { activeItem, activeItemData, toggleFavorite, openHotkeyPicker, startDrop } =
  useInventoryItemActions(() => miscList.value);

function useItem(formId: string) {
  const item = miscList.value.find((f) => f.formId === formId);
  if (!item) return;

  // Use (consume) the misc item when double-clicked (if supported)
  wsStore.sendCommand({ command: 'use', formId });
}
</script>
