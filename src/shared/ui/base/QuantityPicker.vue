<template>
  <div class="input-group quantity-picker">
    <button
      class="qty-btn"
      :disabled="modelValue <= 1"
      @click="decrease"
    >
      −
    </button>
    <div class="qty-display">
      {{ modelValue }}
    </div>
    <button
      class="qty-btn"
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
/* Frame styles come from .input-group; only the buttons & display layout are unique */

.quantity-picker {
  gap: var(--spacing-xs);
}

.qty-btn {
  width: 48px;
  height: 48px;
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

  @media (hover: hover) {
    &:hover:not(:disabled) {
      background-color: var(--bg-accent-soft);
      color: var(--skyrim-accent-gold);
    }
  }

  &:active:not(:disabled) {
    background-color: var(--bg-accent-medium);
  }

  &:disabled {
    opacity: var(--opacity-faint);
    cursor: not-allowed;
  }
}

.qty-display {
  min-width: 3rem;
  text-align: center;
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--skyrim-text-accent);
  padding: 0 var(--spacing-xs);
}
</style>
