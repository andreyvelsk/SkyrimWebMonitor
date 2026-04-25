<template>
  <div class="exit-confirm-modal">
    <p class="exit-confirm-modal__message">
      {{ $t('modals.exitConfirm.message') }}
    </p>
    <div class="exit-confirm-modal__actions">
      <button
        class="btn btn-danger"
        @click="onConfirm"
      >
        {{ $t('modals.exitConfirm.yes') }}
      </button>
      <button
        class="btn btn-secondary"
        @click="emit('close')"
      >
        {{ $t('modals.exitConfirm.no') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  confirm: [];
  close: [];
}>();

function onConfirm() {
  emit('confirm');
  emit('close');
}
</script>

<style scoped lang="scss">
.exit-confirm-modal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.exit-confirm-modal__message {
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  color: var(--skyrim-text-primary);
  text-align: center;
  margin: 0;
}

.exit-confirm-modal__actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}
</style>
