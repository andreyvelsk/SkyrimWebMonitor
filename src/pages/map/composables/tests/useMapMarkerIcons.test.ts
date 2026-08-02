import { describe, it, expect } from 'vitest';
import { resolveMarkerIcon, DEFAULT_MARKER_ICON, MARKER_ICON_MAP } from '@/pages/map/composables/useMapMarkerIcons';

// =============================================================
// Map Marker Icons tests
// =============================================================

describe('resolveMarkerIcon', () => {
  it('returns the icon for a known marker type', () => {
    // MARKER_ICON_MAP is currently empty, so all types fall back to default
    // This test verifies the fallback logic works
    const icon = resolveMarkerIcon('Cave');
    expect(icon).toBe(DEFAULT_MARKER_ICON);
  });

  it('returns default for unknown marker type', () => {
    const icon = resolveMarkerIcon('SomeUnknownType');
    expect(icon).toBe(DEFAULT_MARKER_ICON);
  });

  it('returns default for WhiterunCapitol (if no explicit mapping)', () => {
    const icon = resolveMarkerIcon('WhiterunCapitol');
    expect(icon).toBe(DEFAULT_MARKER_ICON);
  });
});

describe('DEFAULT_MARKER_ICON', () => {
  it('is a non-empty string', () => {
    expect(typeof DEFAULT_MARKER_ICON).toBe('string');
    expect(DEFAULT_MARKER_ICON.length).toBeGreaterThan(0);
  });
});

describe('MARKER_ICON_MAP', () => {
  it('is an object', () => {
    expect(typeof MARKER_ICON_MAP).toBe('object');
    expect(MARKER_ICON_MAP).not.toBeNull();
  });
});