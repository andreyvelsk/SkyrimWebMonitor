<template>
  <div class="list">
    <inventory-item
      name="Dragonscale Armor"
      description="Armor: 82"
      :equipped="true"
    />
    <inventory-item
      name="Ebony Helmet"
      description="Armor: 24"
      :equipped="true"
    />
    <inventory-item
      name="Glass Boots"
      description="Armor: 18"
    />
  </div>
</template>

<script setup lang="ts">
import { InventoryItem } from '@/shared/ui';
</script>

