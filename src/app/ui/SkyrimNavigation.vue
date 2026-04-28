<template>
  <header class="navigation-header">
    <nav
      ref="tabsRef"
      class="tab-bar"
      role="tablist"
      :aria-label="$t('app.navigation.mainAriaLabel')"
    >
      <button
        v-for="tab in nav.tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: nav.activeTab === tab.id }"
        role="tab"
        :aria-selected="nav.activeTab === tab.id"
        @click="nav.setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <nav
      v-if="visibleSubTabs.length > 0"
      ref="subtabsRef"
      class="subtab-bar animate-fade-in"
      role="tablist"
      :aria-label="$t('app.navigation.subAriaLabel')"
    >
      <button
        v-for="sub in visibleSubTabs"
        :key="sub.id"
        class="subtab"
        :class="{ active: nav.activeSubTab === sub.id }"
        role="tab"
        :aria-selected="nav.activeSubTab === sub.id"
        @click="nav.setActiveSubTab(sub.id)"
      >
        {{
          $te(`app.tabs.${nav.activeTab}.subtabs.${sub.id}`)
            ? $t(`app.tabs.${nav.activeTab}.subtabs.${sub.id}`)
            : sub.label
        }}
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';

const tabsRef = ref<HTMLElement | null>(null);
const subtabsRef = ref<HTMLElement | null>(null);
const nav = useNavigationStore();

const visibleSubTabs = computed(() => nav.getVisibleSubTabs());

// Center the active item in the horizontally scrollable container.
// If items fit, CSS `justify-content: safe center` centers them and
// scrollWidth <= clientWidth, so scrollTo is clamped to 0 (no-op).
function centerActive(container: HTMLElement | null, activeSelector: string) {
  if (!container) return;
  const activeBtn = container.querySelector(
    activeSelector
  ) as HTMLElement | null;
  if (!activeBtn) return;

  const btnCenter = activeBtn.offsetLeft + activeBtn.offsetWidth / 2;
  const targetLeft = btnCenter - container.clientWidth / 2;
  const maxLeft = container.scrollWidth - container.clientWidth;

  container.scrollTo({
    left: Math.max(0, Math.min(targetLeft, maxLeft)),
    behavior: 'smooth',
  });
}

watch(
  () => nav.activeTab,
  async () => {
    await nextTick();
    centerActive(tabsRef.value, '.tab.active');
    if (subtabsRef.value) {
      subtabsRef.value.scrollLeft = 0;
    }
  }
);

watch(
  () => nav.activeSubTab,
  async () => {
    await nextTick();
    centerActive(subtabsRef.value, '.subtab.active');
  }
);
</script>

<style scoped lang="scss">
/*
 * Tab and subtab styles come from the design system:
 *   .tab-bar, .tab, .subtab-bar, .subtab (components/tabs.scss).
 * Only the header wrapper (sticky positioning) is component-specific.
 */

.navigation-header {
  flex-shrink: 0;
  background-color: var(--skyrim-bg-medium);
  position: relative;
  z-index: var(--z-sticky);
}
</style>
