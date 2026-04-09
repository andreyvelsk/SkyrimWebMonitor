<template>
  <div class="list">
    <inventory-item
      name="Daedric Sword"
      description="Damage: 48"
      :equipped="true"
    />
    <inventory-item
      name="Elven Bow"
      description="Damage: 32"
    />
    <inventory-item
      name="Glass Dagger"
      description="Damage: 18"
    />
    <inventory-item
      name="Steel Greatsword"
      description="Damage: 26"
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
