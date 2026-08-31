<template>
  <g :style="{ '--rest-scale': restScale }">
    <g
      v-for="m in markers"
      :key="m.key"
      class="hotspot-marker-group"
      :class="{ 'hotspot-marker-group--selected': m.key === selectedMarkerKey }"
      :transform="`translate(${m.x} ${m.y})`"
    >
      <g
        class="hotspot-marker-scale"
        :class="{ 'hotspot-marker-scale--selected': m.key === selectedMarkerKey }"
      >
        <use
          class="hotspot-marker hotspot-marker--blink"
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
import type { QuestProjectedMarker } from '../../lib/types';

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
// Quest markers blink in / out smoothly to draw the player's eye.
// The selected marker stops blinking so the user can read it.
.hotspot-marker-group {
  pointer-events: none;
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

.hotspot-marker--blink {
  animation: quest-marker-blink 1000ms ease-in-out infinite;
}

.hotspot-marker-group--selected .hotspot-marker--blink {
  animation: none;
  opacity: 1;
}

@keyframes quest-marker-blink {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.35;
  }

  100% {
    opacity: 1;
  }
}
</style>
