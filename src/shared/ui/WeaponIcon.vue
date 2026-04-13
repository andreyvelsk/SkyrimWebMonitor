<template>
  <img
    :src="iconSrc"
    :alt="weaponType || 'weapon'"
    :width="size"
    :height="size"
    class="weapon-icon"
  >
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getWeaponIconPath } from '@/shared/lib/constants/weaponIcons';
import { buildIconPath } from '@/shared/lib/utils/iconPath';
import type { WeaponType } from '@/stores/inventory/types';

interface Props {
  weaponType?: WeaponType;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  weaponType: null,
  size: 24,
});

const iconSrc = computed(() => {
  const relativePath = getWeaponIconPath(props.weaponType);
  return buildIconPath(relativePath);
});
</script>

<style scoped lang="scss">
.weapon-icon {
  display: block;
  object-fit: contain;
  image-rendering: crisp-edges;
}
</style>
