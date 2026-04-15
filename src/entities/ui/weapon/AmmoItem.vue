<template>
  <inventory-item
    :name="name"
    :quantity="quantity"
    :is-favorite="isFavorite"
    :active="active"
    @click="$emit('click')"
  >
    <template #status>
      <div
        v-if="isEquipped"
        class="ammo-status"
      >
        <div class="ammo-equipped-indicator" />
      </div>
    </template>
  </inventory-item>
</template>

<script setup lang="ts">
import { InventoryItem } from '@/shared/ui/items';

defineProps<{
  name: string;
  quantity?: number;
  isFavorite?: boolean;
  isEquipped?: boolean;
  active?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style scoped lang="scss">
.ammo-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.ammo-equipped-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--skyrim-text-accent);
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.5);
}
</style>
