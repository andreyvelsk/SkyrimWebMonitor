<template>
  <header class="navigation-header">
    <nav
      class="skyrim-tabs"
      role="tablist"
      :aria-label="$t('app.navigation.mainAriaLabel')"
    >
      <button
        v-for="tab in nav.tabs"
        :key="tab.id"
        class="skyrim-tab"
        :class="{ active: nav.activeTab === tab.id }"
        role="tab"
        :aria-selected="nav.activeTab === tab.id"
        @click="nav.setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <nav
      v-if="nav.currentSubTabs.length > 1"
      ref="subtabsRef"
      class="skyrim-subtabs animate-fade-in"
      role="tablist"
      :aria-label="$t('app.navigation.subAriaLabel')"
    >
      <button
        v-for="sub in nav.currentSubTabs"
        :key="sub.id"
        class="skyrim-subtab"
        :class="{ active: nav.activeSubTab === sub.id }"
        role="tab"
        :aria-selected="nav.activeSubTab === sub.id"
        @click="nav.setActiveSubTab(sub.id)"
      >
        {{ sub.label }}
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';

const subtabsRef = ref<HTMLElement | null>(null);
const nav = useNavigationStore();

watch(
  () => nav.activeTab,
  () => {
    if (subtabsRef.value) {
      subtabsRef.value.scrollLeft = 0;
    }
  }
);

// Ensure active subtab is fully visible when it changes
watch(
  () => nav.activeSubTab,
  async () => {
    await nextTick();
    const container = subtabsRef.value;
    if (!container) return;

    const activeBtn = container.querySelector(
      '.skyrim-subtab.active'
    ) as HTMLElement | null;
    if (!activeBtn) return;

    const btnLeft = activeBtn.offsetLeft;
    const btnRight = btnLeft + activeBtn.offsetWidth;
    const viewLeft = container.scrollLeft;
    const viewRight = viewLeft + container.clientWidth;
    const PADDING = 12;

    if (btnLeft < viewLeft) {
      container.scrollTo({
        left: Math.max(0, btnLeft - PADDING),
        behavior: 'smooth',
      });
    } else if (btnRight > viewRight) {
      container.scrollTo({
        left: btnRight - container.clientWidth + PADDING,
        behavior: 'smooth',
      });
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
      background-color: var(--skyrim-bg-dark);
      border-bottom: 2px solid var(--skyrim-border-dark);
    }

    &.skyrim-subtabs {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      background-color: var(--skyrim-bg-dark);
      border-bottom: 2px solid var(--skyrim-border-dark);
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;

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
      font-size: var(--font-size-lg);
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all var(--transition-normal);
      text-transform: uppercase;

      &.active {
        background-color: var(--tab-bg-active);
        color: var(--tab-text-active);
      }
    }
  }
}
</style>
