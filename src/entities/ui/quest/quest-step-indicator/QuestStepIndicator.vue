<template>
  <div class="quest-step-indicator">
    <div :class="dotClass" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  completed: boolean;
  failed: boolean;
}>();

const dotClass = computed(() => {
  if (props.completed) return 'step-dot step-dot--completed';
  if (props.failed) return 'step-dot step-dot--failed';
  return 'step-dot step-dot--pending';
});
</script>

<style scoped lang="scss">
.quest-step-indicator {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.step-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.step-dot--completed {
  background-color: var(--skyrim-text-accent);
  box-shadow: inset 0 0 2px rgb(0 0 0 / 50%);
}

.step-dot--pending {
  border: 1px solid var(--skyrim-text-accent);
}

.step-dot--failed {
  border: 1px solid var(--color-danger);
}
</style>
