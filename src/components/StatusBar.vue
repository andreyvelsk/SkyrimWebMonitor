<template>
  <div class="flex items-center gap-2 px-2">
    <!-- Left Arrow -->
    <div class="flex-shrink-0 text-gray-600 text-sm font-bold">
      ◀
    </div>

    <!-- Bar Container -->
    <div class="flex-1 relative h-8 border-2 border-gray-700 bg-gray-900 overflow-hidden">
      <!-- Fill -->
      <div
        :style="{
          width: `${normalizedValue}%`,
          backgroundColor: barColor,
        }"
        class="h-full transition-all duration-300 ease-out shadow-lg"
      />

      <!-- Inner Border Effect -->
      <div class="absolute inset-0 border border-gray-800 pointer-events-none" />

      <!-- Glow Effect (optional) -->
      <div
        v-if="normalizedValue > 0"
        :style="{
          width: `${normalizedValue}%`,
          backgroundColor: barColor,
          opacity: 0.3,
        }"
        class="absolute inset-0 blur-md pointer-events-none"
      />
    </div>

    <!-- Right Arrow -->
    <div class="flex-shrink-0 text-gray-600 text-sm font-bold">
      ▶
    </div>
  </div>

  <!-- Value Display (optional) -->
  <div
    v-if="showValue"
    class="text-center text-xs text-gray-500 mt-1"
  >
    {{ normalizedValue }}%
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /**
   * Value from 0 to 100
   */
  value: {
    type: Number,
    default: 0,
    validator: (v) => v >= 0 && v <= 100,
  },

  /**
   * Color in hex format (e.g., '#FF3333')
   */
  color: {
    type: String,
    default: '#FF3333',
    validator: (v) => /^#[0-9A-F]{6}$/i.test(v),
  },

  /**
   * Show percentage value below bar
   */
  showValue: {
    type: Boolean,
    default: false,
  },
});

// Ensure value is between 0 and 100
const normalizedValue = computed(() => {
  return Math.max(0, Math.min(100, props.value));
});

// Ensure color is properly formatted
const barColor = computed(() => {
  const color = props.color.toUpperCase();
  return /^#[0-9A-F]{6}$/.test(color) ? color : '#FF3333';
});
</script>

