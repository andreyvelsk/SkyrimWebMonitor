<template>
  <inventory-list
    v-model="activeItem"
    :items="weaponsList"
    :empty-message="$t('pages.inventory.weapons.waitingForData')"
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
      <ammo-item
        v-else-if="isAmmoItem(item)"
        :name="item.name || $t('pages.inventory.weapons.unknown')"
        :is-equipped="item.isEquipped || false"
        :is-favorite="item.isFavorite || false"
        :active="active"
        :quantity="item.count"
        template
        @click="onSelect"
      />
    </template>
    
    <template #preview>
      <weapon-preview
        v-if="isWeaponItem(activeItemData)"
        :data="activeItemData"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { WeaponItem, AmmoItem } from '@/entities/ui';
import { InventoryList } from '@/features/ui';
import WeaponPreview from '@/entities/ui/weapon/WeaponPreview.vue';
import { HandPicker } from '@/shared/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useModal } from '@/shared/lib/composables/useModal';
import { isWeaponItem, isAmmoItem } from '@/stores/adapters/typeGuards';
import { useInventoryItemActions } from '@/pages/inventory/composables/useInventoryItemActions';
import type { EquipSlot } from '@/stores/inventory/types';

const inventoryStore = useInventoryStore();
const { weaponsList } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();
const { openModal, closeModal } = useModal();

const { activeItem, activeItemData, toggleFavorite, startDrop } = useInventoryItemActions(
  () => weaponsList.value
);

function equipItem(formId: string) {
  const item = weaponsList.value.find(w => w.formId === formId);
  if (!item) return;

  if (!isWeaponItem(item) && isAmmoItem(item)) {
    const command = item.isEquipped ? 'unequip' : 'equip';
    wsStore.sendCommand(command, formId);
    return;
  }

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
</script>
