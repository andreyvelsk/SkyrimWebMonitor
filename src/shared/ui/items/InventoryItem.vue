<template>
  <div
    class="inv-item"
    :class="{ 'inv-item--favorite': isFavorite }"
  >
    <!-- Status indicator slot -->
    <div class="inv-status">
      <slot name="status" />
    </div>

    <!-- Main content -->
    <div class="inv-info">
      <span class="inv-name">{{ name }}</span>
      <slot name="description" />
    </div>

    <!-- Icon slot -->
    <div class="inv-icon">
      <slot name="icon" />
    </div>

    <!-- Quantity -->
    <div
      v-if="quantity"
      class="inv-quantity"
    >
      {{ quantity }}
    </div>

    <!-- Favorite indicator (overlaid, doesn't shift text) -->
    <div
      v-if="isFavorite"
      class="inv-favorite-indicator"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  quantity?: number;
  isFavorite?: boolean;
}>();
</script>

<style scoped lang="scss">
.inv-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;

  &.inv-item--favorite {
    border-left: 3px solid var(--skyrim-accent-gold);
  }

  &:hover {
    background-color: rgb(201 162 39 / 8%);
    border-color: var(--skyrim-accent-gold-dim);
  }

  &:active {
    background-color: rgb(201 162 39 / 12%);
  }
}

.inv-status {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0 var(--spacing-sm);
}

.inv-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.inv-name {
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  color: var(--skyrim-text-primary);
  word-break: break-word;
}

.inv-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.inv-quantity {
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--skyrim-text-accent);
  padding-right: var(--spacing-sm);
  flex-shrink: 0;
  min-width: 2rem;
  text-align: right;
}

.inv-favorite-indicator {
  position: absolute;
  right: 2px;
  top: 2px;
  width: 4px;
  height: 4px;
  background-color: var(--skyrim-accent-gold);
  border-radius: 1px;
}
</style>
