<template>
  <inventory-list
    v-model="activeItem"
    :items="apparelList"
    :empty-message="$t('pages.inventory.apparel.waitingForData')"
    @favorite="toggleFavorite"
    @hotkey="openHotkeyPicker"
    @drop="startDrop"
    @item-double-click="equipItem"
  >
    <template #default="{ item, active, onSelect }">
      <apparel-item
        v-if="isApparelItem(item)"
        :name="item.name || $t('pages.inventory.apparel.unknown')"
        :armor-type="item.armorType"
        :is-equipped="item.isEquipped || false"
        :is-favorite="item.isFavorite || false"
        :active="active"
        :quantity="item.count"
        @click="onSelect"
      />
    </template>

    <template #preview>
      <apparel-preview
        v-if="isApparelItem(activeItemData)"
        :data="activeItemData"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ApparelItem, ApparelPreview } from '@/entities/ui';
import { InventoryList } from '@/features/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { isApparelItem } from '@/stores/adapters/typeGuards';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';

const inventoryStore = useInventoryStore();
const { apparelList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();

const { activeItem, activeItemData, toggleFavorite, openHotkeyPicker, startDrop } =
  useInventoryItemActions(() => apparelList.value);

function equipItem(formId: string) {
  const item = apparelList.value.find((a) => a.formId === formId);
  if (!item) return;

  // Toggle equip/unequip
  if (item.isEquipped) {
    wsStore.sendCommand({ command: 'unequip', formId });
  } else {
    wsStore.sendCommand({ command: 'equip', formId });
  }
}
</script>
