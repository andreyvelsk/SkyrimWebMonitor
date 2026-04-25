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
  right: 2px;
  bottom: 2px;
  font-size: 8px;
  font-family: monospace;
  color: var(--skyrim-text-secondary);
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
  z-index: 9999;
  letter-spacing: 0.05em;
}
</style>
