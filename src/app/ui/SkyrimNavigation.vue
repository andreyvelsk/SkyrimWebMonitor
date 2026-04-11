<template>
  <header class="navigation-header">
    <nav
      class="skyrim-tabs"
      role="tablist"
      :aria-label="$t('app.navigation.mainAriaLabel')"
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
      ref="subtabsRef"
      class="skyrim-subtabs animate-fade-in"
      role="tablist"
      :aria-label="$t('app.navigation.subAriaLabel')"
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
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import type { Tab } from '@/stores/use-navigation-store/types/types';

const subtabsRef = ref<HTMLElement | null>(null);
let touchStartX = 0;
let touchEndX = 0;

const props = defineProps<{
  tabs: Tab[];
  activeTab: string;
  activeSubTab: string;
}>();

const emit = defineEmits<{
  'tab-change': [tabId: string];
  'subtab-change': [subTabId: string];
}>();

const currentSubTabs = computed(
  () => props.tabs.find((t) => t.id === props.activeTab)?.subTabs ?? []
);

const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.changedTouches[0].screenX;
};

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
};

const handleSwipe = () => {
  const threshold = 50; // Minimum swipe distance
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) < threshold) return;

  const currentIndex = currentSubTabs.value.findIndex(
    (sub) => sub.id === props.activeSubTab
  );

  if (diff > 0) {
    // Swiped left - go to next subtab
    if (currentIndex < currentSubTabs.value.length - 1) {
      emit('subtab-change', currentSubTabs.value[currentIndex + 1].id);
    }
  } else {
    // Swiped right - go to previous subtab
    if (currentIndex > 0) {
      emit('subtab-change', currentSubTabs.value[currentIndex - 1].id);
    }
  }
};

const setupSwipeListeners = () => {
  if (subtabsRef.value) {
    subtabsRef.value.addEventListener('touchstart', handleTouchStart);
    subtabsRef.value.addEventListener('touchend', handleTouchEnd);
  }
};

const removeSwipeListeners = () => {
  if (subtabsRef.value) {
    subtabsRef.value.removeEventListener('touchstart', handleTouchStart);
    subtabsRef.value.removeEventListener('touchend', handleTouchEnd);
  }
};

onMounted(() => {
  setupSwipeListeners();
});

onUnmounted(() => {
  removeSwipeListeners();
});

watch(
  () => props.activeTab,
  () => {
    if (subtabsRef.value) {
      subtabsRef.value.scrollLeft = 0;
    }
  }
);
</script>

<style scoped lang="scss">
.navigation-header {
  flex-shrink: 0;
  background-color: var(--skyrim-bg-medium);
  position: relative;
  z-index: 10;

  & nav {
    &.skyrim-tabs {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--tab-gap);
      padding: var(--spacing-sm);
      background-color: var(--skyrim-bg-dark);
      border-bottom: 1px solid var(--skyrim-border-dark);
    }

    &.skyrim-subtabs {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs);
      background-color: var(--skyrim-bg-dark);
      border-bottom: 1px solid var(--skyrim-border-dark);
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      /* Allow horizontal touch scrolling and swiping */
      touch-action: pan-x;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }

  button {
    &.skyrim-tab {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: var(--tab-height);
      padding: 0 var(--spacing-sm);
      background-color: var(--tab-bg-inactive);
      color: var(--tab-text-inactive);
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: 500;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border: none;
      cursor: pointer;
      transition: all var(--transition-normal);

      &:hover {
        background-color: var(--tab-bg-hover);
        color: var(--tab-text-hover);
      }

      &.active {
        background-color: var(--tab-bg-active);
        color: var(--tab-text-active);
      }
    }

    &.skyrim-subtab {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: var(--subtab-height);
      padding: 0 var(--spacing-md);
      background-color: var(--subtab-bg-inactive);
      color: var(--subtab-text-inactive);
      font-family: var(--font-body);
      font-size: var(--font-size-base);
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all var(--transition-normal);

      &:hover {
        background-color: var(--subtab-bg-hover);
        color: var(--subtab-text-hover);
      }

      &.active {
        background-color: var(--subtab-bg-active);
        color: var(--subtab-text-active);
      }
    }
  }
}
</style>
