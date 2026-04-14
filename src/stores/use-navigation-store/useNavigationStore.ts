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

  const subTabsToHide = ['favorites', 'soulgems'];

  const activeTab = ref<string>('character');
  const activeSubTab = ref<string>('stats');
  const transitionDirection = ref<'left' | 'right' | ''>('');

  const currentSubTabs = computed<SubTab[]>(() => {
    const tab = tabs.value.find((t) => t.id === activeTab.value);
    return tab?.subTabs?.filter((sub) => !subTabsToHide.includes(sub.id)) ?? [];
  });

  /**
   * Change active tab and reset sub-tab to first available
   */
  const setActiveTab = (tabId: string): void => {
    const tab = tabs.value.find((t) => t.id === tabId);
    if (!tab) return;

    activeTab.value = tabId;
    activeSubTab.value = ''; // Reset sub-tab when changing main tab

    // Prefer first visible sub-tab, fall back to first available
    const visible = currentSubTabs.value;
    if (visible.length) {
      setActiveSubTab(visible[0].id);
    } else if (tab.subTabs?.length) {
      setActiveSubTab(tab.subTabs[0].id);
    }
  };

  /**
   * Change active sub-tab
   */
  const setActiveSubTab = (subTabId: string, animate = true): void => {
    if (animate) {
      const list = subTabsMap.value[activeTab.value] ?? [];
      const prevIdx = list.findIndex((s) => s.id === activeSubTab.value);
      const newIdx = list.findIndex((s) => s.id === subTabId);

      if (prevIdx === -1 || newIdx === -1) {
        transitionDirection.value = '';
      } else if (newIdx > prevIdx) {
        transitionDirection.value = 'left';
      } else if (newIdx < prevIdx) {
        transitionDirection.value = 'right';
      } else {
        transitionDirection.value = '';
      }
    } else {
      transitionDirection.value = '';
    }

    activeSubTab.value = subTabId;
  };

  /**
   * Switch to next sub-tab for current active tab (if exists).
   * If no active sub-tab is set, select the first one.
   */
  const nextSubTab = (): void => {
    const list = currentSubTabs.value ?? [];
    if (!list.length) return;

    const idx = list.findIndex((s) => s.id === activeSubTab.value);
    if (idx === -1) {
      setActiveSubTab(list[0].id);
      return;
    }

    const nextIdx = idx + 1;
    if (nextIdx < list.length) {
      setActiveSubTab(list[nextIdx].id);
    }
  };

  /**
   * Switch to previous sub-tab for current active tab (if exists).
   * If no active sub-tab is set, select the last one.
   */
  const prevSubTab = (): void => {
    const list = currentSubTabs.value ?? [];
    if (!list.length) return;

    const idx = list.findIndex((s) => s.id === activeSubTab.value);
    if (idx === -1) {
      setActiveSubTab(list[list.length - 1].id);
      return;
    }

    const prevIdx = idx - 1;
    if (prevIdx >= 0) {
      setActiveSubTab(list[prevIdx].id);
    }
  };

  /**
   * Update subTabs for a specific tab (e.g. populated dynamically from a server subscription)
   * If the affected tab is currently active, the first subTab is selected automatically.
   */
  const setTabSubTabs = (tabId: string, newSubTabs: SubTab[]): void => {
    if (!(tabId in subTabsMap.value)) return;

    subTabsMap.value[tabId] = newSubTabs;

    const visible = newSubTabs.filter((s) => !subTabsToHide.includes(s.id));
    if (activeTab.value === tabId && visible.length > 0 && !visible.some((st) => st.id === activeSubTab.value)) {
      setActiveSubTab(visible[0].id);
    }
  };

  return {
    tabs,
    activeTab,
    activeSubTab,
    setActiveTab,
    setActiveSubTab,
    transitionDirection,
    currentSubTabs,
    nextSubTab,
    prevSubTab,
    setTabSubTabs,
  };
});
