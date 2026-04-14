import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Tab, SubTab } from './types/types';

export const useNavigationStore = defineStore('navigation', () => {
  const { t } = useI18n();

  const subTabsMap = ref<Record<string, SubTab[]>>({
    character: [{ id: 'stats', label: t('pages.character.stats.tab') }],
    inventory: [],
  });

  const tabs = computed<Tab[]>(() => [
    {
      id: 'character',
      label: t('app.tabs.character'),
      subTabs: subTabsMap.value.character.map((s) => ({
        ...s,
        label: s.label ?? t(`pages.character.${s.id}.tab`),
      })),
    },
    {
      id: 'inventory',
      label: t('app.tabs.inventory'),
      subTabs: subTabsMap.value.inventory,
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
    if (!(tabId in subTabsMap.value)) return;

    subTabsMap.value[tabId] = newSubTabs;

    if (activeTab.value === tabId && newSubTabs.length > 0 && !newSubTabs.some(st => st.id === activeSubTab.value)) {
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
