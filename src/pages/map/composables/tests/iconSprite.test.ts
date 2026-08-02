import { describe, it, expect } from 'vitest';
import { iconUrlToSymbolId } from '@/pages/map/composables/iconSprite';

// =============================================================
// Icon Sprite tests
// =============================================================

describe('iconUrlToSymbolId', () => {
  it('generates id from simple URL', () => {
    const result = iconUrlToSymbolId('/icons/lorc/sword.svg');
    expect(result).toBe('map-icon--icons-lorc-sword-svg');
  });

  it('replaces special characters with hyphens', () => {
    const result = iconUrlToSymbolId('/icons/test/file name.svg');
    expect(result).toBe('map-icon--icons-test-file-name-svg');
  });

  it('handles URLs with query parameters', () => {
    const result = iconUrlToSymbolId('/icons/test.svg?v=1');
    expect(result).toBe('map-icon--icons-test-svg-v-1');
  });

  it('handles URLs with hash', () => {
    const result = iconUrlToSymbolId('/icons/test.svg#fragment');
    expect(result).toBe('map-icon--icons-test-svg-fragment');
  });

  it('preserves alphanumeric chars, hyphens and underscores', () => {
    const result = iconUrlToSymbolId('my-icon_test-123');
    expect(result).toBe('map-icon-my-icon_test-123');
  });

  it('handles empty string', () => {
    const result = iconUrlToSymbolId('');
    expect(result).toBe('map-icon-');
  });
});