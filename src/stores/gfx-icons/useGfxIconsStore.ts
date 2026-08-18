import { defineStore } from 'pinia';
import { ref } from 'vue';
import { svgToDataUrl } from '@/shared/lib/gfx';

export const useGfxIconsStore = defineStore('gfxIcons', () => {
  // Raw SVG strings keyed by shapeId (== MapHotspot.typeId).
  const svgByShapeId = ref<Record<number, string>>({});
  const isReady = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Resolve an SVG data URL for the given typeId, or null when unknown.
   */
  function resolveIconUrl(typeId: number): string | null {
    const svg = svgByShapeId.value[typeId];
    if (!svg) return null;
    return svgToDataUrl(svg);
  }

  /**
   * Replace the whole icon set and mark it ready.
   */
  function setIcons(svgMap: Record<number, string>): void {
    svgByShapeId.value = { ...svgMap };
    isReady.value = true;
  }

  function reset(): void {
    svgByShapeId.value = {};
    isReady.value = false;
    isLoading.value = false;
    error.value = null;
  }

  return {
    svgByShapeId,
    isReady,
    isLoading,
    error,
    resolveIconUrl,
    setIcons,
    reset,
  };
});
