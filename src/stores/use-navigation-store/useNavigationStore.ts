import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Tab } from './types/types';

export const useNavigationStore = defineStore('navigation', () => {
  // State - Navigation structure (independent from pageRegistry)
  // This can be updated/filtered separately from available pages
  const tabs = ref<Tab[]>([
    {
      id: 'character',
      label: 'Character',
      subTabs: [
        { id: 'stats', label: 'Stats' },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      subTabs: [
        { id: 'weapons', label: 'Weapons' },
        { id: 'apparel', label: 'Apparel' },
      ],
    },
  ]);

  const activeTab = ref<string>('character');
  const activeSubTab = ref<string>('stats');

  /**
   * Change active tab and reset sub-tab to first available
   */
  const setActiveTab = (tabId: string): void => {
    const tab = tabs.value.find((t) => t.id === tabId);
    if (!tab) return;

    activeTab.value = tabId;
    if (tab.subTabs?.length) {
      activeSubTab.value = tab.subTabs[0].id;
    }
  };

  /**
   * Change active sub-tab
   */
  const setActiveSubTab = (subTabId: string): void => {
    activeSubTab.value = subTabId;
  };

  return {
    tabs,
    activeTab,
    activeSubTab,
    setActiveTab,
    setActiveSubTab,
  };
});
