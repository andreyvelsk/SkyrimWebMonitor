<template>
  <button
    type="button"
    class="base-switch"
    :class="{ 'base-switch--on': modelValue }"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    @click="onToggle"
  >
    <span
      class="base-switch__thumb"
      aria-hidden="true"
    />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function onToggle(): void {
  emit('update:modelValue', !props.modelValue);
}
</script>

<style scoped lang="scss">
$switch-width: 2.75rem;
$switch-height: 1.5rem;
$thumb-size: 1rem;
$thumb-gap: 2px;

.base-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: $switch-width;
  height: $switch-height;
  padding: 0;
  border: 1px solid var(--skyrim-border-dark);
  border-radius: 999px;
  background-color: var(--skyrim-bg-light);
  cursor: pointer;
  touch-action: manipulation;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast);

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--skyrim-accent-main-dim);
  }

  &:disabled {
    opacity: var(--opacity-disabled);
    cursor: not-allowed;
  }

  &--on {
    background-color: var(--bg-accent-medium);
    border-color: var(--skyrim-accent-main-dim);
  }
}

.base-switch__thumb {
  position: absolute;
  left: $thumb-gap;
  top: 50%;
  width: $thumb-size;
  height: $thumb-size;
  border-radius: 50%;
  background-color: var(--skyrim-text-dim);
  transform: translateY(-50%);
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast);

  .base-switch--on & {
    transform: translateY(-50%) translateX(calc(#{$switch-width} - #{$thumb-size} - 2 * #{$thumb-gap}));
    background-color: var(--skyrim-accent-main);
  }
}
</style>