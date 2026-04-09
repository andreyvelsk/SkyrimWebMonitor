<template>
  <div class="attribute-row">
    <span class="attr-label">{{ label }}</span>
    <span class="attr-divider" />
    <span class="attr-value">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string }>();
</script>

<style scoped>
.attribute-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--skyrim-border-dark);
}

.attr-label {
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-secondary);
  min-width: 120px;
}

.attr-divider {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--skyrim-border-dark), transparent);
}

.attr-value {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-accent);
}
</style>
