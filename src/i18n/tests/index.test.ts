import { describe, it, expect } from 'vitest';
import { mapGameLanguage } from '@/i18n/index';

// =============================================================
// i18n tests
// =============================================================

describe('mapGameLanguage', () => {
  it('maps RUSSIAN to ru', () => {
    expect(mapGameLanguage('RUSSIAN')).toBe('ru');
  });

  it('maps ENGLISH to en', () => {
    expect(mapGameLanguage('ENGLISH')).toBe('en');
  });

  it('maps lowercase russian to ru', () => {
    expect(mapGameLanguage('russian')).toBe('ru');
  });

  it('maps lowercase english to en', () => {
    expect(mapGameLanguage('english')).toBe('en');
  });

  it('maps mixed case to correct locale', () => {
    expect(mapGameLanguage('RuSsIaN')).toBe('ru');
  });

  it('returns en for unknown language', () => {
    expect(mapGameLanguage('FRENCH')).toBe('en');
  });

  it('returns en for empty string', () => {
    expect(mapGameLanguage('')).toBe('en');
  });

  it('returns en for arbitrary string', () => {
    expect(mapGameLanguage('gibberish')).toBe('en');
  });
});