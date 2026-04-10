<template>
  <div class="handheld-device">
    <skyrim-navigation
      :tabs="tabs"
      :active-tab="activeTab"
      :active-sub-tab="activeSubTab"
      @tab-change="setActiveTab"
      @subtab-change="setActiveSubTab"
    />

    <main class="content-area">
      <skyrim-content
        :tab="activeTab"
        :sub-tab="activeSubTab"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { SkyrimNavigation, SkyrimContent } from '@/entities/ui';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';

const navigationStore = useNavigationStore();
const { setActiveTab, setActiveSubTab } = navigationStore;
const { tabs, activeTab, activeSubTab } = storeToRefs(navigationStore);
</script>

<style scoped lang="scss">
.handheld-device {
  position: relative;
  width: 100%;
  height: 100vh;
  margin: 0 auto;
  background-color: var(--skyrim-bg-dark);
  border: 2px solid var(--skyrim-border-medium);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse at top, transparent 60%, rgb(0 0 0 / 30%) 100%),
      radial-gradient(ellipse at bottom, transparent 60%, rgb(0 0 0 / 40%) 100%);
  }
}

.content-area {
  flex: 1;
  padding: var(--spacing-sm);
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
