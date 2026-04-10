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

.drop-button {
  flex-shrink: 0;
  padding: var(--spacing-md);
  margin: 0 var(--spacing-md) var(--spacing-md) var(--spacing-md);
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-primary);
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background-color: rgb(201 162 39 / 8%);
    border-color: var(--skyrim-accent-gold-dim);
  }
}
</style>
