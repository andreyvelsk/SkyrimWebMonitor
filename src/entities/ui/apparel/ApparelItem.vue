<template>
  <inventory-item
    :name="name"
    :quantity="quantity"
    :is-favorite="isFavorite"
  >
    <template #status>
      <div
        v-if="isEquipped"
        class="apparel-status"
      >
        <div class="apparel-equipped-indicator" />
      </div>
    </template>

    <template #icon>
      <apparel-icon :apparel-type="apparelType" />
    </template>
  </inventory-item>
</template>

<script setup lang="ts">
import { InventoryItem } from '@/shared/ui/items';
import { ApparelIcon } from '@/entities/ui';
import type { ApparelType } from '@/stores/inventory/types';

defineProps<{
  name: string;
  apparelType: ApparelType;
  quantity?: number;
  isFavorite?: boolean;
  isEquipped?: boolean;
}>();
</script>

<style scoped lang="scss">
.apparel-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.apparel-equipped-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--skyrim-text-accent);
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.5);
}
</style>
