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
        :apparel-type="item.apparelType"
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
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { ApparelItem } from '@/entities/ui';
import { InventoryList } from '@/features/ui';
import { DropItemsModal } from '@/shared/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useModal } from '@/shared/lib/composables/useModal';
import { isApparelItem } from '@/stores/adapters/typeGuards';

const inventoryStore = useInventoryStore();
const { apparelList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();
const { closeModal, openModal } = useModal();

const activeItem = ref<string | null>(null);

const activeItemData = computed(() => {
  if (!activeItem.value) return null;
  return apparelList.value.find(a => a.formId === activeItem.value) || null;
});

function equipItem(formId: string) {
  const item = apparelList.value.find(a => a.formId === formId);
  if (!item) return;

  // Toggle equip/unequip
  if (item.isEquipped) {
    wsStore.sendCommand('unequip', formId);
  } else {
    wsStore.sendCommand('equip', formId);
  }
}

function toggleFavorite() {
  if (!activeItem.value) return;
  wsStore.sendCommand('favorite', activeItem.value);
}

function startDrop() {
  if (!activeItemData.value || !activeItem.value) return;

  const count = activeItemData.value.count;

  // If more than 5 items, show modal for quantity selection
  if (count > 5) {
    openModal({
      component: DropItemsModal,
      props: {
        maxCount: count,
      },
      on: {
        drop: (qty: number) => {
          wsStore.sendCommand('drop', activeItem.value!, undefined, qty);
          closeModal();
        },
      },
    });
    return;
  }

  // If 5 or fewer, drop one
  wsStore.sendCommand('drop', activeItem.value, undefined, 1);
}
</script>

<style scoped lang="scss">
// Component uses InventoryList styles
</style>
