<template>
  <foreignObject
    v-for="m in markers"
    :key="m.key"
    :x="m.x - markerMaxHalf"
    :y="m.y - markerMaxSize"
    :width="markerMaxSize"
    :height="markerMaxSize"
    style="pointer-events: none"
  >
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      class="hotspot-marker"
      :class="{
        'hotspot-marker--dim': !m.canFastTravel,
        'hotspot-marker--selected': m.key === selectedMarkerKey,
      }"
      :style="{
        '--icon-src': `url('${m.iconUrl}')`,
        '--marker-rest-scale': restScale,
      }"
    />
  </foreignObject>
</template>

<script setup lang="ts">
import type { LocationProjectedMarker } from '../../types';

defineProps<{
  markers: LocationProjectedMarker[];
  markerMaxHalf: number;
  markerMaxSize: number;
  restScale: string;
  selectedMarkerKey: string | null;
}>();
</script>

<style scoped lang="scss">
.hotspot-marker {
  width: 100%;
  height: 100%;
  background-color: var(--skyrim-bg-light);
  mask-image: var(--icon-src);
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center bottom;
  // Markers are visual-only — OSD must receive all touch/mouse events for
  // pan/zoom. Clicks are delegated via the parent's hit-test.
  // `touch-action: none` is critical on iOS Safari, where <foreignObject>
  // children otherwise claim the touch gesture before pointer-events:none
  // takes effect.
  pointer-events: none;
  touch-action: none;
  transform: scale(var(--marker-rest-scale, 1));
  transform-origin: 50% 100%;
  transition:
    transform 200ms ease-out,
    background-color var(--transition-fast);
}

.hotspot-marker--dim {
  opacity: 0.45;
}

.hotspot-marker--selected {
  background-color: var(--skyrim-accent-gold);
  transform: scale(1);
}
</style>
