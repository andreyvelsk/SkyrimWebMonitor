<template>
  <div class="handheld-device">
    <div class="ornament-corner top-left" />
    <div class="ornament-corner top-right" />
    <div class="ornament-corner bottom-left" />
    <div class="ornament-corner bottom-right" />

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
.content-area {
  flex: 1;
  overflow-y: auto;
}
</style>
