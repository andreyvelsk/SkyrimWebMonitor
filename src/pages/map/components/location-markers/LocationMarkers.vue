<template>
  <g :style="{ '--rest-scale': restScale }">
    <g
      v-for="m in markers"
      :key="m.key"
      class="hotspot-marker-group"
      :class="{
        'hotspot-marker-group--dim': !m.canFastTravel,
        'hotspot-marker-group--selected': m.key === selectedMarkerKey,
      }"
      :transform="`translate(${m.x} ${m.y})`"
    >
      <g
        class="hotspot-marker-scale"
        :class="{ 'hotspot-marker-scale--selected': m.key === selectedMarkerKey }"
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
  </g>
</template>

<script setup lang="ts">
import type { LocationProjectedMarker } from '../../types';

defineProps<{
  markers: LocationProjectedMarker[];
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
  transition: opacity var(--transition-fast);
}

.hotspot-marker {
  pointer-events: none;
}

.hotspot-marker-scale {
  transform: scale(var(--rest-scale, 1));
  transform-origin: 0 0;
  transition: transform 180ms ease-out;
}

.hotspot-marker-scale--selected {
  transform: scale(1);
}

.hotspot-marker {
  transform-box: fill-box;
  transform-origin: center bottom;
}

.hotspot-marker-group--dim {
  opacity: 0.45;
}
</style>
