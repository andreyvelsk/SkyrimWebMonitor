import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import {
  resolveMarkerIcon,
  resolveGfxIconUrl,
  resolveLocationIcon,
  DEFAULT_MARKER_ICON,
  DEFAULT_UNDISCOVERED_MARKER_ICON
} from '@/pages/map/composables/useMapMarkerIcons';
import { useGfxIconsStore } from '@/stores/gfx-icons/useGfxIconsStore';
import { TYPE_ID_TO_GFX_SHAPE_ID } from '@/features/gfx-icons/config/typeIdToGfxId';

// =============================================================
// Map Marker Icons tests
// =============================================================

describe('resolveMarkerIcon', () => {
  it('returns the icon for a known marker type', () => {
    expect(resolveMarkerIcon()).toBe(DEFAULT_MARKER_ICON);
    expect(resolveMarkerIcon(false)).toBe(DEFAULT_UNDISCOVERED_MARKER_ICON);
  });
});

describe('DEFAULT_MARKER_ICON', () => {
  it('is a non-empty string', () => {
    expect(typeof DEFAULT_MARKER_ICON).toBe('string');
    expect(DEFAULT_MARKER_ICON.length).toBeGreaterThan(0);
  });
});

describe('TYPE_ID_TO_GFX_SHAPE_ID', () => {
  it('maps typeId 15 to known=299 and undiscovered=236', () => {
    expect(TYPE_ID_TO_GFX_SHAPE_ID[15]).toEqual({ known: 299, undiscovered: 236 });
  });

  it('returns undefined for unmapped typeId', () => {
    expect(TYPE_ID_TO_GFX_SHAPE_ID[999]).toBeUndefined();
  });
});

describe('resolveGfxIconUrl', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns a data URL for a mapped typeId when the shape is loaded', () => {
    const store = useGfxIconsStore();
    store.setIcons({ 299: '<svg xmlns="http://www.w3.org/2000/svg"/>' });

    const url = resolveGfxIconUrl(15, true); // known
    expect(url).toContain('data:image/svg+xml,');
  });

  it('returns undiscovered shape for canFastTravel: false', () => {
    const store = useGfxIconsStore();
    store.setIcons({ 236: '<svg xmlns="http://www.w3.org/2000/svg"/>' });

    const url = resolveGfxIconUrl(15, false); // undiscovered
    expect(url).toContain('data:image/svg+xml,');
  });

  it('returns null for unmapped typeId', () => {
    const url = resolveGfxIconUrl(999, true);
    expect(url).toBeNull();
  });

  it('returns null when the shape is not loaded', () => {
    // Store is empty — shape 299 is not loaded
    const url = resolveGfxIconUrl(15, true);
    expect(url).toBeNull();
  });
});

describe('resolveLocationIcon', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns GFX icon when typeId is mapped and shape is loaded', () => {
    const store = useGfxIconsStore();
    store.setIcons({ 299: '<svg xmlns="http://www.w3.org/2000/svg"/>' });

    const url = resolveLocationIcon(15, true);
    expect(url).toContain('data:image/svg+xml,');
  });

  it('falls back to resolveMarkerIcon when typeId is not mapped', () => {
    const url = resolveLocationIcon(999, true);
    expect(url).toBe(DEFAULT_MARKER_ICON);
  });

  it('falls back to resolveMarkerIcon when shape is not loaded', () => {
    // Store is empty
    const url = resolveLocationIcon(15, true);
    expect(url).toBe(DEFAULT_MARKER_ICON);
  });
});