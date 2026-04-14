<template>
  <div class="skyrim-weapons">
    <div class="list-wrapper">
      <div class="list">
        <!-- Show weapons if data is available -->
        <template v-if="weaponsList && weaponsList.length > 0">
          <weapon-item
            v-for="(item, index) in weaponsList"
            :key="item.formId || index"
            :name="item.name || $t('pages.inventory.weapons.unknown')"
            :weapon-type="item.weaponType"
            :is-equipped="item.isEquipped || false"
            :equipped-hand="item.equippedHand"
            :is-favorite="item.isFavorite || false"
            :active="activeItem === item.formId"
            :quantity="item.count"
            @click="setActiveItem(item.formId)"
          />
        </template>
        <!-- Fallback to placeholder when no data -->
        <div
          v-else
          class="no-data"
        >
          {{ $t('pages.inventory.weapons.waitingForData') }}
        </div>
      </div>
    </div>

    <!-- Action toolbar -->
    <div class="skyrim-weapons-toolbar">
      <button
        class="toolbar-btn favorite-btn"
        :class="{ favorite: isActiveItemFavorite }"
        :title="isActiveItemFavorite ? $t('common.removeFromFavorites') : $t('common.addToFavorites')"
        :disabled="!activeItem"
        @click="toggleFavorite"
      >
        <base-icon
          icon-path="delapouite/round-star.svg"
          :size="20"
        />
      </button>

      <button
        class="toolbar-btn drop-btn"
        :title="$t('common.dropItem')"
        :disabled="!activeItem"
        @click="startDrop"
      >
        <base-icon
          icon-path="delapouite/trash-can.svg"
          :size="20"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed }  from 'vue';
import { storeToRefs } from 'pinia';
import { WeaponItem } from '@/entities/ui';
import { HandPicker, DropItemsModal, BaseIcon } from '@/shared/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useModal } from '@/shared/lib/composables/useModal';
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

const isActiveItemFavorite = computed(() => {
  return activeItemData.value?.isFavorite || false;
});

function setActiveItem(formId: string) {
  if (activeItem.value !== formId) {
    activeItem.value = formId;
    return;
  }

  equipItem(formId);
}

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
        itemName: activeItemData.value.name,
        maxCount: count,
      },
      on: {
        drop: (qty: number) => {
          wsStore.sendCommand('drop', activeItem.value!, undefined, qty);
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
.skyrim-weapons {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  gap: var(--spacing-md);
}

.list-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.no-data {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--skyrim-text-muted);
  font-size: 0.9rem;
}

.skyrim-weapons-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);
  --skyrim-text-accent: var(--skyrim-text-secondary);

  &:hover:not(:disabled) {
    background-color: var(--tab-bg-hover);
    border-color: var(--skyrim-accent-gold-dim);
    --skyrim-text-accent: var(--skyrim-text-primary);
  }

  &:active:not(:disabled) {
    background-color: var(--tab-bg-active);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    border-color: var(--skyrim-border-dark);
  }

  &.favorite {
    --skyrim-text-accent: var(--skyrim-accent-gold);

    &:hover:not(:disabled) {
      --skyrim-text-accent: var(--skyrim-accent-gold);
    }
  }
}
</style>
