<template>
  <g
    v-for="m in markers"
    :key="m.key"
    class="hotspot-marker-group"
    :class="{ 'hotspot-marker-group--selected': m.key === selectedMarkerKey }"
    :transform="`translate(${m.x} ${m.y})`"
  >
    <g
      class="hotspot-marker-scale"
      :style="markerStyle(m.key === selectedMarkerKey, restScale)"
    >
      <use
        class="hotspot-marker"
        :href="`#${iconSymbolByUrl[m.iconUrl]}`"
        :x="-markerMaxHalf"
        :y="-markerMaxSize"
        :width="markerMaxSize"
        :height="markerMaxSize"
        preserveAspectRatio="xMidYMax meet"
      />
    </g>
  </g>
</template>

<script setup lang="ts">
import type { QuestProjectedMarker } from '../../types';

function markerStyle(selected: boolean, restScale: string): Record<string, string> {
  const s = selected ? 1 : Number(restScale);
  const finalScale = Number.isFinite(s) ? s : 1;
  return {
    '--marker-scale': String(finalScale),
  };
}

defineProps<{
  markers: QuestProjectedMarker[];
  markerMaxHalf: number;
  markerMaxSize: number;
  restScale: string;
  selectedMarkerKey: string | null;
  iconSymbolByUrl: Record<string, string>;
}>();
</script>

<style scoped lang="scss">
.hotspot-marker-group {
  pointer-events: none;
}

.hotspot-marker {
  pointer-events: none;
}

.hotspot-marker-scale {
  transform: scale(var(--marker-scale, 1));
  transform-origin: 0 0;
  transition: transform 180ms ease-out;
}

.hotspot-marker {
  transform-box: fill-box;
  transform-origin: center bottom;
}
</style>
