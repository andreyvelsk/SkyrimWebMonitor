<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="fill"
    :stroke="stroke"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="apparel-icon"
  >
    <path :d="getIconPath()" />
  </svg>
</template>

<script setup lang="ts">
import { getApparelIcon } from '@/shared/lib/constants/itemIcons';

interface Props {
  apparelType?: string | null;
  size?: number;
  fill?: string;
  stroke?: string;
}

const props = withDefaults(defineProps<Props>(), {
  apparelType: null,
  size: 24,
  fill: 'none',
  stroke: 'currentColor',
});

// SVG пути для иконок брони
const ICON_PATHS: Record<string, string> = {
  helm: 'M6 10L8 4L12 2L16 4L18 10C18 14 15 16 12 18C9 16 6 14 6 10Z',
  skull: 'M12 2C15 2 17 4 17 7C17 9 16 11 15 12L9 12C8 11 7 9 7 7C7 4 9 2 12 2Z M8 14L16 14',
  dress: 'M12 2L8 6L8 10L6 12L6 20L18 20L18 12L16 10L16 6L12 2Z',
  gloves: 'M6 8L6 16L9 18L9 8M15 8L15 18L18 16L18 8Z M10 8L14 8',
  boot: 'M8 12L8 20L11 22L11 14M13 14L13 22L16 20L16 12Z',
  coat: 'M6 6L8 4L12 2L16 4L18 6L18 14C18 18 15 20 12 22C9 20 6 18 6 14Z',
  gem: 'M12 2L18 8L16 18L12 20L8 18L6 8Z',
};

function getIconPath(): string {
  const iconName = getApparelIcon(props.apparelType);
  return ICON_PATHS[iconName] || ICON_PATHS.dress;
}
</script>

<style scoped lang="scss">
.apparel-icon {
  display: block;
}
</style>
