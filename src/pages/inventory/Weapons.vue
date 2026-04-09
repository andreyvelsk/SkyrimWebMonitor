<template>
  <div class="skyrim-weapons">
    <div class="list-wrapper">
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
    </div>
    <button class="drop-button">
      drop
    </button>
  </div>
</template>

<script setup lang="ts">
import { InventoryItem } from '@/shared/ui';
</script>

<style scoped>
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

.list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.drop-button {
  flex-shrink: 0;
  padding: var(--spacing-md);
  margin: 0 var(--spacing-md) var(--spacing-md) var(--spacing-md);
}
</style>
