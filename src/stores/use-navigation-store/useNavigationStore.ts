import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Tab, SubTab } from './types/types';

export const useNavigationStore = defineStore('navigation', () => {
  const { t } = useI18n();

  const subTabsMap = ref<Record<string, SubTab[]>>({
    character: [
      { id: 'stats', label: t('pages.character.stats.tab') },
      { id: 'hotkeys', label: t('pages.character.hotkeys.tab') },
    ],
    inventory: [],
    magic: [],
    map: [
      { id: 'view', label: '' },
    ],
  });

  const tabs = computed<Tab[]>(() => [
    {
      id: 'character',
      label: t('app.tabs.character.label'),
      subTabs: subTabsMap.value.character.map((s) => ({
        ...s,
        label: s.label ?? t(`pages.character.${s.id}.tab`),
      })),
    },
    {
      id: 'inventory',
      label: t('app.tabs.inventory.label'),
      subTabs: subTabsMap.value.inventory,
    },
    {
      id: 'magic',
      label: t('app.tabs.magic.label'),
      subTabs: subTabsMap.value.magic,
    },
    {
      id: 'map',
      label: t('app.tabs.map.label'),
      subTabs: subTabsMap.value.map,
    }
  ]);

  const subTabsToHide = ['favorites', 'soulgems', 'ammo', 'view'];

  const activeTab = ref<string>('character');
  const activeSubTab = ref<string>('stats');
  const transitionDirection = ref<'left' | 'right' | ''>('');

  // Remembers the last active sub-tab per main tab so that returning
  // to a tab restores its previously selected sub-tab (only on tab click,
  // not when swiping between sub-tabs).
  const lastSubTabMap = ref<Record<string, string>>({});

  // Optional ordering map: specify sub-tab ids order per tab.
  // If an entry is empty or missing, fallback to server order.
  const subTabsOrderMap = ref<Record<string, string[]>>({
    inventory: [
      'weapons', 
      'apparel', 
      'potions', 
      'scrolls', 
      'food',
      'ingredients',
      'books',
      'keys',
      'misc',
    ],
  });

  const getVisibleSubTabs = (tabId?: string): SubTab[] => {
    const id = tabId ?? activeTab.value;
    const tab = tabs.value.find((t) => t.id === id);
    const visible = tab?.subTabs?.filter((sub) => !subTabsToHide.includes(sub.id)) ?? [];
    return visible;
  };

  /**
   * Change active tab and reset sub-tab to first available
   */
  /**
   * Change active tab and optionally select a sub-tab.
   * @param tabId - id of tab to activate
   * @param selectSubTab - whether to automatically select a subtab (default true)
   * @param forcedDirection - optional forced transition direction to apply when selecting the subtab
   */
  const setActiveTab = (tabId: string, selectSubTab = true, forcedDirection?: 'left' | 'right' | ''): void => {
    const tab = tabs.value.find((t) => t.id === tabId);
    if (!tab) return;

    // Compute direction based on main tab order if not forced.
    // This is needed because activeSubTab is reset below, which would
    // otherwise prevent setActiveSubTab from computing a direction.
    let direction = forcedDirection;
    if (direction === undefined && tabId !== activeTab.value) {
      const prevTabIdx = tabs.value.findIndex((t) => t.id === activeTab.value);
      const newTabIdx = tabs.value.findIndex((t) => t.id === tabId);
      if (prevTabIdx !== -1 && newTabIdx !== -1) {
        direction = newTabIdx > prevTabIdx ? 'left' : newTabIdx < prevTabIdx ? 'right' : '';
      }
    }

    activeTab.value = tabId;
    activeSubTab.value = ''; // Reset sub-tab when changing main tab

    if (!selectSubTab) return;

    // Prefer last-visited visible sub-tab for this tab, then ordered first,
    // then first visible, then first available.
    const visible = getVisibleSubTabs();
    const remembered = lastSubTabMap.value[tabId];
    if (remembered && visible.some((s) => s.id === remembered)) {
      setActiveSubTab(remembered, true, direction);
      return;
    }
    if (visible.length) {
      setActiveSubTab(visible[0].id, true, direction);
    } else if (tab.subTabs?.length) {
      setActiveSubTab(tab.subTabs[0].id, true, direction);
    }
  };

  /**
   * Change active sub-tab
   */
  /**
   * Change active sub-tab.
   * @param subTabId - id of subtab to activate
   * @param animate - whether to compute transition direction automatically (default true)
   * @param forcedDirection - optional forced direction (overrides automatic computation)
   */
  const setActiveSubTab = (
    subTabId: string,
    animate = true,
    forcedDirection?: 'left' | 'right' | ''
  ): void => {
    if (forcedDirection !== undefined) {
      transitionDirection.value = forcedDirection;
    } else if (animate) {
    const list = getVisibleSubTabs() ?? [];
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
      // do not compute direction and do not overwrite any previously-forced direction
    }

    activeSubTab.value = subTabId;
    if (subTabId && activeTab.value) {
      lastSubTabMap.value[activeTab.value] = subTabId;
    }
  };

  /**
   * Switch to next sub-tab for current active tab (if exists).
   * If no active sub-tab is set, select the first one.
   */
  const nextSubTab = (): void => {
    const list = getVisibleSubTabs() ?? [];
    if (!list.length) return;

    const idx = list.findIndex((s) => s.id === activeSubTab.value);
    if (idx === -1) {
      setActiveSubTab(list[0].id);
      return;
    }

    const nextIdx = idx + 1;
    if (nextIdx < list.length) {
      setActiveSubTab(list[nextIdx].id);
      return;
    }

    // At end of visible subtabs -> try next tab
    const tabIdx = tabs.value.findIndex((t) => t.id === activeTab.value);
    let nextTabIdx = tabIdx + 1;
    while (nextTabIdx < tabs.value.length) {
      const nextTab = tabs.value[nextTabIdx];
      const visible = nextTab.subTabs?.filter((s) => !subTabsToHide.includes(s.id)) ?? [];
      if (visible.length) {
        // select next tab and its first visible subtab, force left transition
        setActiveTab(nextTab.id, false);
        setActiveSubTab(visible[0].id, true, 'left');
        return;
      }
      if (nextTab.subTabs?.length) {
        // tab has only hidden subtabs (e.g. single-page tabs) — still select it
        setActiveTab(nextTab.id, false);
        setActiveSubTab(nextTab.subTabs[0].id, true, 'left');
        return;
      }
      nextTabIdx += 1;
    }
  };

  /**
   * Switch to previous sub-tab for current active tab (if exists).
   * If no active sub-tab is set, select the last one.
   */
  const prevSubTab = (): void => {
    const list = getVisibleSubTabs() ?? [];
    if (!list.length) return;

    const idx = list.findIndex((s) => s.id === activeSubTab.value);
    if (idx === -1) {
      setActiveSubTab(list[list.length - 1].id);
      return;
    }

    const prevIdx = idx - 1;
    if (prevIdx >= 0) {
      setActiveSubTab(list[prevIdx].id);
      return;
    }

    // At start of visible subtabs -> try previous tab
    const tabIdx = tabs.value.findIndex((t) => t.id === activeTab.value);
    let prevTabIdx = tabIdx - 1;
    while (prevTabIdx >= 0) {
      const prevTab = tabs.value[prevTabIdx];
      const visible = prevTab.subTabs?.filter((s) => !subTabsToHide.includes(s.id)) ?? [];
      if (visible.length) {
        // select previous tab and its last visible subtab, force right transition
        setActiveTab(prevTab.id, false);
        setActiveSubTab(visible[visible.length - 1].id, true, 'right');
        return;
      }
      if (prevTab.subTabs?.length) {
        // tab has only hidden subtabs (e.g. single-page tabs) — still select it
        setActiveTab(prevTab.id, false);
        setActiveSubTab(prevTab.subTabs[0].id, true, 'right');
        return;
      }
      prevTabIdx -= 1;
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
      const order = subTabsOrderMap.value[tabId] ?? [];
      if (order && order.length) {
        const firstOrdered = order.find((id) => visible.some((s) => s.id === id));
        if (firstOrdered) {
          setActiveSubTab(firstOrdered);
          return;
        }
      }
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
    getVisibleSubTabs,
    subTabsOrderMap,
    nextSubTab,
    prevSubTab,
    setTabSubTabs,
  };
});
