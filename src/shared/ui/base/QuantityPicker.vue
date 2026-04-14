<template>
  <div class="quantity-picker">
    <button
      class="qty-btn qty-minus"
      :disabled="modelValue <= 1"
      @click="decrease"
    >
      −
    </button>
    <div class="qty-display">
      {{ modelValue }}
    </div>
    <button
      class="qty-btn qty-plus"
      :disabled="modelValue >= max"
      @click="increase"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  max: number;
}>();

const modelValue = defineModel<number>({ default: 1 });

function decrease() {
  if (modelValue.value > 1) {
    modelValue.value--;
  }
}

function increase() {
  if (modelValue.value < props.max) {
    modelValue.value++;
  }
}
</script>

<style scoped lang="scss">
.quantity-picker {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  border-radius: 2px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  color: var(--skyrim-text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background-color: rgb(201 162 39 / 8%);
    color: var(--skyrim-accent-gold);
  }

  &:active:not(:disabled) {
    background-color: rgb(201 162 39 / 16%);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.qty-display {
  min-width: 3rem;
  text-align: center;
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--skyrim-text-accent);
  padding: 0 var(--spacing-xs);
}
</style>
