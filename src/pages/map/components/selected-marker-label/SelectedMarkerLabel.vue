<template>
  <foreignObject
    :x="marker.x - markerSize"
    :y="marker.y + selectedLabelOffset"
    :width="markerSize * 2"
    :height="labelHeight"
    class="map-markers__label-host"
  >
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      class="hotspot-label"
    >
      <span
        class="hotspot-label__text"
        :style="{
          fontSize: `${labelFontSize}px`,
          lineHeight: `${labelLineHeight}px`,
          padding: `${labelPaddingY}px ${labelPaddingX}px`,
        }"
      >{{ marker.label }}</span>
    </div>
  </foreignObject>
</template>

<script setup lang="ts">
import type { ProjectedMarker } from '../../types';

defineProps<{
  marker: ProjectedMarker;
  markerSize: number;
  selectedLabelOffset: number;
  labelHeight: number;
  labelFontSize: number;
  labelLineHeight: number;
  labelPaddingX: number;
  labelPaddingY: number;
}>();
</script>

<style scoped lang="scss">
.map-markers__label-host {
  pointer-events: none;
  overflow: visible;
}

.hotspot-label {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.hotspot-label__text {
  display: inline-block;
  background-color: var(--skyrim-bg-medium);
  border: 1px solid var(--skyrim-border-medium);
  color: var(--skyrim-text-primary);
  font-family: var(--font-heading);
  white-space: nowrap;
  text-overflow: ellipsis;
  box-shadow: var(--shadow-strong);
}
</style>
