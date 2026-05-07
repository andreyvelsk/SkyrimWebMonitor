<template>
  <foreignObject
    :x="marker.x - labelMaxWidth / 2"
    :y="marker.y + selectedLabelOffset"
    :width="labelMaxWidth"
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
import { computed } from 'vue';
import type { ProjectedMarker } from '../../types';

const LABEL_MAX_WIDTH_EM = 15;
const labelMaxWidthCss = `${LABEL_MAX_WIDTH_EM}em`;

const props = defineProps<{
  marker: ProjectedMarker;
  markerSize: number;
  selectedLabelOffset: number;
  labelHeight: number;
  labelFontSize: number;
  labelLineHeight: number;
  labelPaddingX: number;
  labelPaddingY: number;
}>();

const labelMaxWidth = computed(
  () => props.labelFontSize * LABEL_MAX_WIDTH_EM + props.labelPaddingX * 2 + 2
);
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
  box-shadow: var(--shadow-strong);
  max-width: v-bind(labelMaxWidthCss);
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: center;
}
</style>
