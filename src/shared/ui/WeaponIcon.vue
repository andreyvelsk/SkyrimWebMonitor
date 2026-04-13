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
    class="weapon-icon"
  >
    <path :d="getIconPath()" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getWeaponIcon } from '@/shared/lib/constants/weaponIcons';
import type { WeaponType } from '@/stores/inventory/types';

interface Props {
  weaponType?: WeaponType;
  size?: number;
  fill?: string;
  stroke?: string;
}

const props = withDefaults(defineProps<Props>(), {
  weaponType: null,
  size: 24,
  fill: 'none',
  stroke: 'currentColor',
});

// Простые SVG пути для иконок оружия
const ICON_PATHS: Record<string, string> = {
  sword: 'M12 2L13 8L19 6L14 12L19 18L13 16L12 22L11 16L5 18L10 12L5 6L11 8L12 2Z',
  dagger: 'M12 2L13 8L12 20L11 8L12 2Z M9 10L15 10',
  axe: 'M12 2L8 8L8 20L12 18L16 20L16 8L12 2Z',
  mace: 'M12 2C10 2 9 4 9 6L9 10L15 10L15 6C15 4 14 2 12 2Z M10 12L14 12L14 20L10 20Z',
  sword2: 'M12 2L13 8L19 6L14 12L19 18L13 16L12 22L11 16L5 18L10 12L5 6L11 8L12 2Z',
  axe2: 'M12 2L8 8L8 20L12 18L16 20L16 8L12 2Z',
  bow: 'M8 6L12 2L16 6L16 18L12 20L8 18Z M10 10L14 10',
  wand2: 'M12 2L11 8L12 18L13 8L12 2Z M10 4L14 4 M9 6L15 6',
  crossbow: 'M6 10L18 10L18 12L6 12Z M12 6V16 M8 8L16 14 M16 8L8 14',
  fist: 'M8 12L6 8C5 6 5 4 7 4C8 4 9 5 10 6L10 12L12 12L12 5C12 3 13 2 14 2C15 2 16 3 16 5V12L8 12Z',
};

const iconName = computed(() => getWeaponIcon(props.weaponType));

function getIconPath(): string {
  return ICON_PATHS[iconName.value] || ICON_PATHS.sword;
}
</script>

<style scoped lang="scss">
.weapon-icon {
  display: block;
}
</style>
