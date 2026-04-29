<template>
  <div class="modal-content fast-travel-modal">
    <div class="modal-header">
      <p
        v-if="locationName"
        class="modal-subtitle"
      >
        {{ locationName }}
      </p>
    </div>

    <p class="modal-message">
      {{ $t('pages.map.fastTravel.message') }}
    </p>

    <div class="modal-actions">
      <button
        class="btn btn-primary"
        @click="onConfirm"
      >
        {{ $t('pages.map.fastTravel.confirm') }}
      </button>
      <button
        class="btn btn-secondary"
        @click="onCancel"
      >
        {{ $t('pages.map.fastTravel.cancel') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  locationName?: string;
}

defineProps<Props>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function onConfirm() {
  emit('confirm');
}

function onCancel() {
  emit('cancel');
}
</script>

<style scoped lang="scss">
.fast-travel-modal {
  min-width: 320px;
  max-width: 420px;
}
</style>
