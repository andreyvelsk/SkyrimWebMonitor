<template>
  <div
    v-if="isEquipped"
    :class="['equip-status', { 'equip--centered': centered }]"
  >
    <div class="equip-equipped-indicator" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isEquipped?: boolean;
  centered?: boolean;
}>();
</script>

<style scoped lang="scss">
.equip-status {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.equip--centered {
  justify-content: center;
}

.equip-equipped-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--skyrim-text-accent);
  box-shadow: inset 0 0 2px rgb(0 0 0 / 50%);
}
</style>
