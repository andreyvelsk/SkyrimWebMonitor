<template>
  <div
    class="weapon-icon"
    :style="{ '--icon-src': `url('${iconSrc}')`, '--icon-size': `${size}px` }"
  />
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
  width: var(--icon-size);
  height: var(--icon-size);
  background-color: var(--skyrim-text-accent);
  -webkit-mask-image: var(--icon-src);
  mask-image: var(--icon-src);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}
</style>
