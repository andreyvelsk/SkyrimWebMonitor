<template>
  <div class="input-group quantity-picker">
    <button
      class="btn btn-ghost btn-icon qty-btn"
      :disabled="modelValue <= 1"
      @click="decrease"
    >
      −
    </button>
    <div class="qty-display">
      {{ modelValue }}
    </div>
    <button
      class="btn btn-ghost btn-icon qty-btn"
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
  /* Override btn-icon size and font-size to match the picker's 48px target */
  width: 48px;
  height: 48px;
  font-size: var(--font-size-lg);

  &:disabled {
    opacity: var(--opacity-faint);
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
