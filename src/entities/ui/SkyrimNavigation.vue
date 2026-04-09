<template>
  <header class="navigation-header">
    <nav
      class="skyrim-tabs"
      role="tablist"
      aria-label="Main navigation"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="skyrim-tab"
        :class="{ active: activeTab === tab.id }"
        role="tab"
        :aria-selected="activeTab === tab.id"
        @click="$emit('tab-change', tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <nav
      v-if="currentSubTabs.length > 1"
      class="skyrim-subtabs animate-fade-in"
      role="tablist"
      aria-label="Sub navigation"
    >
      <button
        v-for="sub in currentSubTabs"
        :key="sub.id"
        class="skyrim-subtab"
        :class="{ active: activeSubTab === sub.id }"
        role="tab"
        :aria-selected="activeSubTab === sub.id"
        @click="$emit('subtab-change', sub.id)"
      >
        {{ sub.label }}
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Tab } from '@/stores/use-navigation-store/types/types';

const props = defineProps<{
  tabs: Tab[];
  activeTab: string;
  activeSubTab: string;
}>();

defineEmits<{
  'tab-change': [tabId: string];
  'subtab-change': [subTabId: string];
}>();

const currentSubTabs = computed(
  () => props.tabs.find((t) => t.id === props.activeTab)?.subTabs ?? []
);
</script>

<style scoped>
.navigation-header {
  flex-shrink: 0;
  background-color: var(--skyrim-bg-medium);
  position: relative;
  z-index: 10;
}
</style>
