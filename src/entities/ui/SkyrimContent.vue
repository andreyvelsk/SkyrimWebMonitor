<template>
  <div
    :key="`${tab}-${subTab}`"
    class="skyrim-panel animate-slide-down"
  >
    <div class="ornament-corner top-left" />
    <div class="ornament-corner top-right" />
    <div class="ornament-corner bottom-left" />
    <div class="ornament-corner bottom-right" />

    <component
      :is="currentComponent"
      v-if="currentComponent"
    />
    <div
      v-else
      class="empty-state"
    >
      <p style="color: var(--skyrim-text-secondary)">
        Select an option to view details
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePageRouter } from '@/shared/router/usePageRouter';

const props = defineProps<{ tab: string; subTab: string }>();

const currentComponent = computed(() => {
  return usePageRouter(props.tab, props.subTab);
});
</script>

<style scoped>
.skyrim-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
