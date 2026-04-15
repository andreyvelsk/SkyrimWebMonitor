<template>
  <div class="stat-bar">
    <div class="stat-header">
      <span v-if="label" class="stat-label">
        {{ label }}
      </span>
    </div>
    <div class="stat-track">
      <div
        class="stat-fill"
        :class="`stat-fill--${color}`"
        :style="{ width: `${pct}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label?: string;
  value: number;
  max: number;
  color: 'health' | 'magicka' | 'stamina';
}>();

const pct = computed(() => (props.value / props.max) * 100);
</script>

<style scoped lang="scss">
.stat-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-accent);
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: var(--font-size-xs);
  color: var(--skyrim-text-secondary);
}

.stat-track {
  height: 1rem;
  background-color: var(--skyrim-bg-dark);
  border: 1px solid var(--skyrim-border-dark);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  transition: width var(--transition-normal);

  &--health {
    background: linear-gradient(90deg, #6b1f1f, #a83232);
    box-shadow: 0 0 8px rgb(168 50 50 / 40%);
  }

  &--magicka {
    background: linear-gradient(90deg, #1f3a6b, #3264a8);
    box-shadow: 0 0 8px rgb(50 100 168 / 40%);
  }

  &--stamina {
    background: linear-gradient(90deg, #4a6b1f, #72a832);
    box-shadow: 0 0 8px rgb(114 168 50 / 40%);
  }
}
</style>
