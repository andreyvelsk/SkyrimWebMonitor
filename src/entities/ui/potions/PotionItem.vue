<template>
  <inventory-item
    :name="name"
    :quantity="quantity"
    :is-favorite="isFavorite"
    :active="active"
    @click="$emit('click')"
  >
    <template #description>
      <div v-if="effects && effects.length > 0" class="potion-effects">
        <div v-for="(eff, idx) in effects" :key="idx" class="potion-effect">
          {{ eff.description || eff.name }}
        </div>
      </div>
    </template>

    <template #icon>
      <base-icon icon-path="lorc/potion-ball.svg" />
    </template>
  </inventory-item>
</template>

<script setup lang="ts">
import { BaseIcon } from '@/shared/ui';
import { InventoryItem } from '@/shared/ui/items';
import type { ItemEnchantmentEffect } from '@/stores/inventory/types';

defineProps<{
  name: string;
  quantity?: number;
  isFavorite?: boolean;
  effects?: ItemEnchantmentEffect[];
  active?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style scoped lang="scss">
.potion-effects {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.85rem;
  color: var(--skyrim-text-secondary);
}

.potion-effect {
  white-space: normal;
}
</style>
