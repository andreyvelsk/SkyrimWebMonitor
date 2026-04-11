import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Tab, SubTab } from './types/types';

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
      subTabs: [],
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
    activeSubTab.value = ''; // Reset sub-tab when changing main tab

    // Set first sub-tab as active if available
    if (tab.subTabs?.length) {
      setActiveSubTab(tab.subTabs[0].id);
    }
  };

  /**
   * Change active sub-tab
   */
  const setActiveSubTab = (subTabId: string): void => {
    activeSubTab.value = subTabId;
  };

  /**
   * Update subTabs for a specific tab (e.g. populated dynamically from a server subscription)
   * If the affected tab is currently active, the first subTab is selected automatically.
   */
  const setTabSubTabs = (tabId: string, newSubTabs: SubTab[]): void => {
    const tab = tabs.value.find((t) => t.id === tabId);
    if (!tab) return;

    tab.subTabs = newSubTabs;

    if (activeTab.value === tabId && newSubTabs.length > 0) {
      setActiveSubTab(newSubTabs[0].id);
    }
  };

  return {
    tabs,
    activeTab,
    activeSubTab,
    setActiveTab,
    setActiveSubTab,
    setTabSubTabs,
  };
});
