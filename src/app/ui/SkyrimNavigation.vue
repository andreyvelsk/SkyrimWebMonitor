<template>
  <header class="navigation-header">
    <nav
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
      v-if="nav.getVisibleSubTabs().length > 1"
      ref="subtabsRef"
      class="subtab-bar animate-fade-in"
      role="tablist"
      :aria-label="$t('app.navigation.subAriaLabel')"
    >
      <button
        v-for="sub in nav.getVisibleSubTabs()"
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
      '.subtab.active'
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
