<template>
  <div class="list-divider attribute-row">
    <span class="attr-label">{{ label }}</span>
    <span class="attr-value">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string }>();
</script>

<style scoped lang="scss">
/* Layout via .list-divider; only typography is component-specific. */

.attribute-row {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
}

.attr-label {
  color: var(--skyrim-text-secondary);
  min-width: 120px;
}

.attr-value {
  color: var(--skyrim-text-accent);
}
</style>
