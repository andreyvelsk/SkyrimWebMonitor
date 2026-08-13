<template>
  <div class="stat-bar">
    <div
      v-if="label"
      class="stat-label"
    >
      {{ label }}
    </div>
    <div class="stat-wrapper">
      <div class="stat-track">
        <div class="stat-track-inner">
          <div
            class="stat-fill"
            :class="`stat-fill--${color}`"
            :style="{ width: `${pct}%` }"
          />
        </div>
      </div>
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
.stat-wrapper {
  --tip-color: #2a2a2a;
  --tip-border: #555;
  --fill-glow: transparent;
}

.stat-wrapper:has(.stat-fill--health) {
  --tip-color: #1a0808;
  --tip-border: #6b2020;
  --fill-glow: rgb(180 40 40 / 50%);
}

.stat-wrapper:has(.stat-fill--magicka) {
  --tip-color: #080818;
  --tip-border: #203070;
  --fill-glow: rgb(40 80 200 / 50%);
}

.stat-wrapper:has(.stat-fill--stamina) {
  --tip-color: #081408;
  --tip-border: #2a5a18;
  --fill-glow: rgb(50 160 50 / 50%);
}

.stat-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-label {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-accent);
  letter-spacing: 0.05em;
  text-align: center;
}

.stat-wrapper {
  display: flex;
  align-items: center;
  height: 22px;
  position: relative;
}

.stat-track {
  flex: 1;
  height: 100%;
  background: linear-gradient(180deg, #1c1c1c 0%, #0a0a0a 50%, #1c1c1c 100%);
  border: 1.5px solid #4a4a4a;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    box-shadow: inset 0 2px 4px rgb(0 0 0 / 80%), inset 0 -1px 2px rgb(0 0 0 / 60%);
    z-index: 2;
    pointer-events: none;
  }
}

.stat-track-inner {
  position: absolute;
  inset: 2px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  transition: width var(--transition-normal);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 45%;
    background: linear-gradient(180deg, rgb(255 255 255 / 25%) 0%, transparent 100%);
    pointer-events: none;
  }

  &--health {
    background: linear-gradient(
      180deg,
      #d44040 0%,
      #b02020 40%,
      #7a1010 70%,
      #9a1818 100%
    );
    box-shadow: 0 0 10px var(--fill-glow, rgb(180 40 40 / 50%));
  }

  &--magicka {
    background: linear-gradient(
      180deg,
      #4060e0 0%,
      #2040c0 40%,
      #102080 70%,
      #1830a0 100%
    );
    box-shadow: 0 0 10px var(--fill-glow, rgb(40 80 200 / 50%));
  }

  &--stamina {
    background: linear-gradient(
      180deg,
      #40c040 0%,
      #20a020 40%,
      #106010 70%,
      #188018 100%
    );
    box-shadow: 0 0 10px var(--fill-glow, rgb(50 160 50 / 50%));
  }
}
</style>
