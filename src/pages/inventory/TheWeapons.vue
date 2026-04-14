<template>
  <inventory-list
    v-model="activeItem"
    :items="weaponsList"
    empty-message="Waiting for weapons data..."
    @favorite="toggleFavorite"
    @drop="startDrop"
    @item-double-click="equipItem"
  >
    <template #default="{ item, active, onSelect }">
      <weapon-item
        v-if="isWeaponItem(item)"
        :name="item.name || $t('pages.inventory.weapons.unknown')"
        :weapon-type="item.weaponType"
        :is-equipped="item.isEquipped || false"
        :equipped-hand="item.equippedHand"
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
import { WeaponItem } from '@/entities/ui';
import { InventoryList } from '@/features/ui';
import { HandPicker, DropItemsModal } from '@/shared/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useModal } from '@/shared/lib/composables/useModal';
import { isWeaponItem } from '@/stores/adapters/typeGuards';
import type { EquipSlot } from '@/stores/inventory/types';

const inventoryStore = useInventoryStore();
const { weaponsList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();
const { closeModal, openModal } = useModal();

const activeItem = ref<string | null>(null);

const activeItemData = computed(() => {
  if (!activeItem.value) return null;
  return weaponsList.value.find(w => w.formId === activeItem.value) || null;
});

function equipItem(formId: string) {
  const item = weaponsList.value.find(w => w.formId === formId);
  if (!item) return;

  // If already equipped
  if (item.isEquipped) {
    // If one-handed and count > 1, show hand picker to switch hand or unequip
    if (!item.isTwoHanded && item.count > 1) {
      openModal({
        component: HandPicker,
        props: {
          equippedHand: item.equippedHand,
          mode: 'equipped',
        },
        on: {
          selectHand: (hand: EquipSlot) => {
            if (hand === item.equippedHand || item.equippedHand === 'both') {
              // Unequip from current hand (or unequip if both hands)
              wsStore.sendCommand('unequip', formId);
            } else {
              // Equip to other hand
              wsStore.sendCommand('equip', formId, hand);
            }
            closeModal();
          },
        },
      });
      return;
    }

    // If two-handed or single copy, just unequip
    wsStore.sendCommand('unequip', formId);
    return;
  }

  // If two-handed weapon, equip directly without hand selection
  if (item.isTwoHanded) {
    wsStore.sendCommand('equip', formId);
    return;
  }

  // If one-handed weapon, show hand picker modal
  openModal({
    component: HandPicker,
    props: {
      mode: 'equip',
    },
    on: {
      selectHand: (hand: EquipSlot) => {
        wsStore.sendCommand('equip', formId, hand);
        closeModal();
      },
    },
  });
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
