import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGfxIconsStore } from '@/stores/gfx-icons/useGfxIconsStore';

describe('useGfxIconsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('has empty state initially', () => {
    const store = useGfxIconsStore();
    expect(store.isReady).toBe(false);
    expect(store.isLoading).toBe(false);
    expect(Object.keys(store.svgByShapeId)).toEqual([]);
  });

  it('setIcons stores the svg map and marks ready', () => {
    const store = useGfxIconsStore();
    store.setIcons({ 139: '<svg/>' });
    expect(store.isReady).toBe(true);
    expect(store.svgByShapeId[139]).toBe('<svg/>');
  });

  it('resolveIconUrl returns a data URL', () => {
    const store = useGfxIconsStore();
    store.setIcons({ 139: '<svg xmlns="http://www.w3.org/2000/svg"/>' });
    const url = store.resolveIconUrl(139);
    expect(url).toContain('data:image/svg+xml,');
  });

  it('resolveIconUrl returns null for unknown typeId', () => {
    const store = useGfxIconsStore();
    expect(store.resolveIconUrl(999)).toBeNull();
  });

  it('reset clears state', () => {
    const store = useGfxIconsStore();
    store.setIcons({ 139: '<svg/>' });
    store.reset();
    expect(store.isReady).toBe(false);
    expect(store.svgByShapeId[139]).toBeUndefined();
  });
});
