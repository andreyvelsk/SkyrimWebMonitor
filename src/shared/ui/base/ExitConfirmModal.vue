<template>
  <div class="modal-content">
    <p class="modal-message">
      {{ $t('modals.exitConfirm.message') }}
    </p>
    <div class="modal-actions">
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

<!-- All styles come from the design system: .modal-content, .modal-message, .modal-actions, .btn, .btn-danger, .btn-secondary -->

