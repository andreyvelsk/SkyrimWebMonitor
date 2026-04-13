<template>
  <inventory-item
    :name="name"
    :quantity="quantity"
    :is-favorite="isFavorite"
  >
    <template #status>
      <equipped-hand-icon
        v-if="isEquipped"
        :equipped-hand="equippedHand"
      />
    </template>

    <template #icon>
      <weapon-icon :weapon-type="weaponType" />
    </template>
  </inventory-item>
</template>

<script setup lang="ts">
import InventoryItem from './InventoryItem.vue';
import { WeaponIcon } from '@/entities/ui';
import { EquippedHandIcon } from '@/features/ui';
import type { WeaponType, EquippedHand } from '@/stores/inventory/types';

defineProps<{
  name: string;
  weaponType: WeaponType;
  quantity?: number;
  isFavorite?: boolean;
  isEquipped?: boolean;
  equippedHand?: EquippedHand;
}>();
</script>
