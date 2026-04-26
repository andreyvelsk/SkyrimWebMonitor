<template>
  <div class="modal-content">
    <div class="flex-center">
      <quantity-picker
        v-model="selectedCount"
        :max="maxCount"
      />
    </div>

    <div class="modal-actions">
      <button
        class="btn btn-primary"
        @click="confirmDrop"
      >
        {{ $t('modals.drop') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import QuantityPicker from './QuantityPicker.vue';

defineProps<{
  maxCount: number;
}>();

const emit = defineEmits<{
  drop: [count: number];
  close: [];
}>();

const selectedCount = ref(1);

function confirmDrop() {
  emit('drop', selectedCount.value);
  emit('close');
}
</script>

<!-- Styles delegated to the design system: .modal-content, .modal-actions, .btn, .btn-primary, .flex-center -->
