<template>
  <div class="drop-items-modal">
    <div class="drop-controls">
      <quantity-picker
        v-model="selectedCount"
        :max="maxCount"
      />
    </div>

    <div class="drop-actions">
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

<style scoped lang="scss">
.drop-items-modal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.drop-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.drop-item {
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  color: var(--skyrim-text-primary);
  margin: 0;
  font-weight: 600;
}

.drop-available {
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-secondary);
  margin: 0;
}

.drop-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);

  label {
    font-family: var(--font-heading);
    font-size: var(--font-size-base);
    color: var(--skyrim-text-primary);
    flex-shrink: 0;
    margin: 0;
  }
}

.drop-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &.btn-primary {
    color: var(--skyrim-text-primary);
    background-color: var(--skyrim-bg-light);

    &:hover {
      background-color: rgb(201 162 39 / 12%);
      border-color: var(--skyrim-accent-gold);
    }

    &:active {
      background-color: rgb(201 162 39 / 20%);
    }
  }

  &.btn-secondary {
    color: var(--skyrim-text-secondary);
    background: transparent;

    &:hover {
      color: var(--skyrim-text-primary);
      background-color: rgb(201 162 39 / 4%);
      border-color: var(--skyrim-accent-gold-dim);
    }
  }
}
</style>
