<template>
  <div class="list">
    <inventory-item
      name="Potion of Ultimate Healing"
      description="Restore 100 Health"
      :quantity="5"
    />
    <inventory-item
      name="Potion of Magicka"
      description="Restore 50 Magicka"
      :quantity="12"
    />
    <inventory-item
      name="Potion of Stamina"
      description="Restore 50 Stamina"
      :quantity="8"
    />
  </div>
</template>

<script setup lang="ts">
import { InventoryItem } from '@/shared/ui';
</script>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
</style>
