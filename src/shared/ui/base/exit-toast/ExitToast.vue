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
  background: rgb(20 20 20 / 92%);
  color: #f0e6d2;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 999px;
  font-size: 14px;
  line-height: 1.3;
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 4px 16px rgb(0 0 0 / 50%);
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
