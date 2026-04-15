<template>
  <inventory-list
    v-model="activeItem"
    :items="apparelList"
    :empty-message="$t('pages.inventory.apparel.waitingForData')"
    @favorite="toggleFavorite"
    @drop="startDrop"
    @item-double-click="equipItem"
  >
    <template #default="{ item, active, onSelect }">
      <apparel-item
        v-if="isApparelItem(item)"
        :name="item.name || $t('pages.inventory.apparel.unknown')"
        :apparel-type="item.armorType"
        :is-equipped="item.isEquipped || false"
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
import { ApparelItem } from '@/entities/ui';
import { InventoryList } from '@/features/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { isApparelItem } from '@/stores/adapters/typeGuards';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';

const inventoryStore = useInventoryStore();
const { apparelList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();

const { activeItem, toggleFavorite, startDrop } = useInventoryItemActions(
  () => apparelList.value
);

function equipItem(formId: string) {
  const item = apparelList.value.find((a) => a.formId === formId);
  if (!item) return;

  // Toggle equip/unequip
  if (item.isEquipped) {
    wsStore.sendCommand('unequip', formId);
  } else {
    wsStore.sendCommand('equip', formId);
  }
}
</script>
