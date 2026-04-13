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
    class="magic-icon"
  >
    <path :d="getIconPath()" />
  </svg>
</template>

<script setup lang="ts">
import { getMagicSchoolIcon } from '@/shared/lib/constants/itemIcons';

interface Props {
  spellSchool?: string | null;
  size?: number;
  fill?: string;
  stroke?: string;
}

const props = withDefaults(defineProps<Props>(), {
  spellSchool: null,
  size: 24,
  fill: 'none',
  stroke: 'currentColor',
});

// SVG пути для иконок магии
const ICON_PATHS: Record<string, string> = {
  wand: 'M12 2L11 8L13 14L12 20L14 14L16 8L15 2Z M9 6L15 6',
  crown: 'M6 12L8 6L12 4L16 6L18 12L12 16Z M10 12L12 14L14 12',
  flame: 'M12 2C14 4 14 8 12 10C10 8 10 4 12 2Z M10 10C8 12 8 16 10 18C7 17 6 14 8 10Z M14 10C16 12 16 16 14 18C17 17 18 14 16 10Z',
  eye: 'M12 10C14 10 15 11 15 13C15 15 14 16 12 16C10 16 9 15 9 13C9 11 10 10 12 10Z M3 13C5 8 8 5 12 5C16 5 19 8 21 13C19 18 16 21 12 21C8 21 5 18 3 13Z',
  cross: 'M12 2L12 22M4 12L20 12',
  sparkles: 'M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z',
};

function getIconPath(): string {
  const iconName = getMagicSchoolIcon(props.spellSchool);
  return ICON_PATHS[iconName] || ICON_PATHS.wand;
}
</script>

<style scoped lang="scss">
.magic-icon {
  display: block;
}
</style>
