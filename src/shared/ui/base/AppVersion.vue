<template>
  <div class="app-version">
    {{ version }}
  </div>
</template>

<script setup lang="ts">
const version = import.meta.env.VITE_APP_VERSION;
</script>

<style scoped lang="scss">
.app-version {
  position: fixed;
  right: 6px;
  bottom: 4px;
  font-size: 9px;
  font-family: monospace;
  color: var(--skyrim-text-dim);
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
  z-index: 9999;
  letter-spacing: 0.05em;
}
</style>
