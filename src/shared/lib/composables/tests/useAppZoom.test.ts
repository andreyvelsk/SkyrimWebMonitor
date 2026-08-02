import { describe, it, expect, beforeEach } from 'vitest';
import { persistZoom, ZOOM_KEY } from '@/shared/lib/composables/useAppZoom';

// =============================================================
// useAppZoom tests
// =============================================================

describe('persistZoom', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves zoom value to localStorage', () => {
    persistZoom(1.5);
    expect(localStorage.getItem(ZOOM_KEY)).toBe('1.5');
  });

  it('saves integer zoom value', () => {
    persistZoom(1);
    expect(localStorage.getItem(ZOOM_KEY)).toBe('1');
  });

  it('saves minimum zoom value', () => {
    persistZoom(0.6);
    expect(localStorage.getItem(ZOOM_KEY)).toBe('0.6');
  });

  it('saves maximum zoom value', () => {
    persistZoom(1.8);
    expect(localStorage.getItem(ZOOM_KEY)).toBe('1.8');
  });

  it('overwrites previous zoom value', () => {
    persistZoom(1.0);
    persistZoom(1.3);
    expect(localStorage.getItem(ZOOM_KEY)).toBe('1.3');
  });
});