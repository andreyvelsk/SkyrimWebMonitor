<template>
  <transition name="exit-toast">
    <div
      v-if="visible"
      class="exit-toast"
      role="status"
      aria-live="polite"
    >
      {{ $t('modals.exitConfirm.message') }}
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean }>();
</script>

<style scoped lang="scss">
.exit-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
  padding: 10px 18px;
  background: color-mix(in srgb, var(--skyrim-bg-medium) 92%, transparent);
  color: var(--skyrim-text-accent);
  border: var(--border-thin) solid var(--skyrim-border-dark);
  border-radius: 999px;
  font-size: var(--font-size-sm);
  line-height: 1.3;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  z-index: var(--z-tooltip);
  box-shadow: var(--shadow-medium);
}

.exit-toast-enter-active,
.exit-toast-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.exit-toast-enter-from,
.exit-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
