import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import type { SubTab } from '@/stores/use-navigation-store/lib/types';

// =============================================================
// useNavigationStore tests
// =============================================================

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'pages.character.stats.tab': 'Stats',
        'pages.character.hotkeys.tab': 'Hotkeys',
        'app.tabs.character.label': 'Character',
        'app.tabs.inventory.label': 'Inventory',
        'app.tabs.magic.label': 'Magic',
        'app.tabs.quests.label': 'Quests',
        'app.tabs.map.label': 'Map',
        'pages.quests.questsList.tab': 'Quests',
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock useSystemStore — quests and map NOT provided by default
vi.mock('@/stores/system/useSystemStore', () => ({
  useSystemStore: () => ({
    isFeatureProvided: (_feature: string): boolean => false,
  }),
  SYSTEM_QUERY_ID: 'system',
  SYSTEM_QUERY_FIELDS: { language: 'Game::Language', features: 'App::Features' },
}));

describe('useNavigationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('activeTab is character', () => {
      const store = useNavigationStore();
      expect(store.activeTab).toBe('character');
    });

    it('activeSubTab is stats', () => {
      const store = useNavigationStore();
      expect(store.activeSubTab).toBe('stats');
    });

    it('tabs includes character, inventory, magic', () => {
      const store = useNavigationStore();
      const tabIds = store.tabs.map((t) => t.id);
      expect(tabIds).toContain('character');
      expect(tabIds).toContain('inventory');
      expect(tabIds).toContain('magic');
    });

    it('tabs does NOT include quests and map when feature not provided', () => {
      const store = useNavigationStore();
      const tabIds = store.tabs.map((t) => t.id);
      expect(tabIds).not.toContain('quests');
      expect(tabIds).not.toContain('map');
    });
  });

  describe('setActiveTab', () => {
    it('changes activeTab and resets activeSubTab', () => {
      const store = useNavigationStore();
      store.setActiveTab('inventory');
      expect(store.activeTab).toBe('inventory');
      // activeSubTab reset, then first visible is selected
      expect(store.activeSubTab).not.toBe('stats');
    });

    it('with selectSubTab=false does not select subtab', () => {
      const store = useNavigationStore();
      store.setActiveTab('inventory', false);
      expect(store.activeTab).toBe('inventory');
      expect(store.activeSubTab).toBe('');
    });

    it('ignores unknown tab', () => {
      const store = useNavigationStore();
      store.setActiveTab('nonexistent');
      expect(store.activeTab).toBe('character');
    });
  });

  describe('setActiveSubTab', () => {
    it('changes activeSubTab', () => {
      const store = useNavigationStore();
      store.setActiveSubTab('hotkeys');
      expect(store.activeSubTab).toBe('hotkeys');
    });

    it('sets transitionDirection based on position change', () => {
      const store = useNavigationStore();
      // character tab has subTabs: stats (idx 0), hotkeys (idx 1)
      store.setActiveSubTab('hotkeys'); // from stats(0) to hotkeys(1) = left
      expect(store.transitionDirection).toBe('left');
    });
  });

  describe('nextSubTab', () => {
    it('switches to next subtab within same tab', () => {
      const store = useNavigationStore();
      // character: ['stats', 'hotkeys'] — stats at idx 0
      store.nextSubTab(); // stats -> hotkeys
      expect(store.activeSubTab).toBe('hotkeys');
      expect(store.transitionDirection).toBe('left');
    });
  });

  describe('prevSubTab', () => {
    it('switches to previous subtab within same tab', () => {
      const store = useNavigationStore();
      store.setActiveSubTab('hotkeys');
      store.prevSubTab(); // hotkeys -> stats
      expect(store.activeSubTab).toBe('stats');
      expect(store.transitionDirection).toBe('right');
    });
  });

  describe('setTabSubTabs', () => {
    it('updates subtabs for inventory', () => {
      const store = useNavigationStore();
      const newSubTabs: SubTab[] = [
        { id: 'weapons', label: 'Weapons' },
        { id: 'apparel', label: 'Apparel' },
        { id: 'misc', label: 'Misc' },
      ];
      store.setTabSubTabs('inventory', newSubTabs);
      const tab = store.tabs.find((t) => t.id === 'inventory');
      expect(tab?.subTabs).toHaveLength(3);
      expect(tab?.subTabs[0].id).toBe('weapons');
    });

    it('does nothing for unknown tab', () => {
      const store = useNavigationStore();
      const before = store.tabs.map((t) => t.id);
      store.setTabSubTabs('nonexistent', [{ id: 'test', label: 'Test' }]);
      const after = store.tabs.map((t) => t.id);
      expect(after).toEqual(before);
    });
  });

  describe('lastSubTabMap (remembering last subtab)', () => {
    it('remembers last subtab and restores it when switching back', () => {
      const store = useNavigationStore();
      // Stay on character, switch to hotkeys
      store.setActiveSubTab('hotkeys');
      // Switch to inventory
      store.setActiveTab('inventory');
      // Switch back to character — should restore hotkeys
      store.setActiveTab('character');
      expect(store.activeSubTab).toBe('hotkeys');
    });
  });

  describe('subTabsOrderMap', () => {
    it('provides default inventory ordering', () => {
      const store = useNavigationStore();
      const orderMap = store.subTabsOrderMap;
      expect(orderMap.inventory).toBeDefined();
      expect(orderMap.inventory).toContain('weapons');
      expect(orderMap.inventory).toContain('apparel');
      expect(orderMap.inventory).toContain('misc');
    });

    it('setTabSubTabs stores subtabs as provided', () => {
      const store = useNavigationStore();
      const subTabs: SubTab[] = [
        { id: 'misc', label: 'Misc' },
        { id: 'weapons', label: 'Weapons' },
        { id: 'apparel', label: 'Apparel' },
      ];
      store.setTabSubTabs('inventory', subTabs);
      const tab = store.tabs.find((t) => t.id === 'inventory');
      // setTabSubTabs stores subtabs as-is; ordering is done by DataRouter before calling this
      expect(tab?.subTabs[0].id).toBe('misc');
      expect(tab?.subTabs[1].id).toBe('weapons');
      expect(tab?.subTabs[2].id).toBe('apparel');
    });
  });
});
