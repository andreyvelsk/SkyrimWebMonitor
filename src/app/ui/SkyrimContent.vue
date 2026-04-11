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
        {{ $t('app.content.emptyState') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePageRouter } from '@/app/router/usePageRouter';

const props = defineProps<{ tab: string; subTab: string }>();

const currentComponent = computed(() => {
  return usePageRouter(props.tab, props.subTab);
});
</script>

<style scoped lang="scss">
.skyrim-panel {
  position: relative;
  background-color: var(--skyrim-bg-medium);
  border: 1px solid var(--skyrim-border-dark);
  padding: var(--spacing-md);
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  overflow: hidden;

  & div {
    &.ornament-corner {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: var(--ornament-color);
      border-style: solid;
      border-width: 0;

      &.top-left {
        top: 0;
        left: 0;
        border-top-width: 2px;
        border-left-width: 2px;
      }

      &.top-right {
        top: 0;
        right: 0;
        border-top-width: 2px;
        border-right-width: 2px;
      }

      &.bottom-left {
        bottom: 0;
        left: 0;
        border-bottom-width: 2px;
        border-left-width: 2px;
      }

      &.bottom-right {
        bottom: 0;
        right: 0;
        border-bottom-width: 2px;
        border-right-width: 2px;
      }
    }
  }
}
</style>
