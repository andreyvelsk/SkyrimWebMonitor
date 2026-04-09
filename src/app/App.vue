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

<style scoped>
.handheld-device {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.content-area {
  flex: 1;
  padding: var(--spacing-sm);
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
