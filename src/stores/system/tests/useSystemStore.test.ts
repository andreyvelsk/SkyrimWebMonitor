import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSystemStore } from '@/stores/system/useSystemStore';

// =============================================================
// useSystemStore tests
// =============================================================

// Mock i18n to avoid actual vue-i18n initialization
vi.mock('@/i18n', () => ({
  i18n: {
    global: {
      locale: { value: 'en' },
    },
  },
  mapGameLanguage: vi.fn((lang: string) => {
    const lower = lang.toLowerCase();
    if (lower === 'russian') return 'ru';
    return 'en';
  }),
}));

describe('useSystemStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('language is null', () => {
      const store = useSystemStore();
      expect(store.language).toBeNull();
    });

    it('features is empty array', () => {
      const store = useSystemStore();
      expect(store.features).toEqual([]);
    });
  });

  describe('handleQueryResponse', () => {
    it('sets language from fields.language', async () => {
      const { mapGameLanguage } = await import('@/i18n');
      const store = useSystemStore();
      store.handleQueryResponse({ language: 'RUSSIAN' });
      expect(store.language).toBe('RUSSIAN');
      expect(mapGameLanguage).toHaveBeenCalledWith('RUSSIAN');
    });

    it('sets language from fields.lang as fallback', () => {
      const store = useSystemStore();
      store.handleQueryResponse({ lang: 'ENGLISH' });
      expect(store.language).toBe('ENGLISH');
    });

    it('does not set language when not a string', () => {
      const store = useSystemStore();
      store.handleQueryResponse({ language: 123 });
      expect(store.language).toBeNull();
    });

    it('sets features from fields.features array', () => {
      const store = useSystemStore();
      store.handleQueryResponse({ features: ['player', 'inventory', 'map'] });
      expect(store.features).toEqual(['player', 'inventory', 'map']);
    });

    it('does not set features when not an array', () => {
      const store = useSystemStore();
      store.handleQueryResponse({ features: 'not-array' });
      expect(store.features).toEqual([]);
    });

    it('handles empty response', () => {
      const store = useSystemStore();
      store.handleQueryResponse({});
      expect(store.language).toBeNull();
      expect(store.features).toEqual([]);
    });
  });

  describe('isFeatureProvided', () => {
    it('returns true for existing feature', () => {
      const store = useSystemStore();
      store.handleQueryResponse({ features: ['player', 'map'] });
      expect(store.isFeatureProvided('player')).toBe(true);
      expect(store.isFeatureProvided('map')).toBe(true);
    });

    it('returns false for missing feature', () => {
      const store = useSystemStore();
      store.handleQueryResponse({ features: ['player'] });
      expect(store.isFeatureProvided('inventory')).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets language to null', () => {
      const store = useSystemStore();
      store.handleQueryResponse({ language: 'RUSSIAN' });
      store.reset();
      expect(store.language).toBeNull();
    });

    it('resets features to empty array', () => {
      const store = useSystemStore();
      store.handleQueryResponse({ features: ['player', 'map'] });
      store.reset();
      expect(store.features).toEqual([]);
    });
  });
});
