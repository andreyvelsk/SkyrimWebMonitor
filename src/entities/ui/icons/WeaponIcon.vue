<template>
  <base-icon
    :icon-path="iconPath"
    :size="size"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseIcon } from '@/shared/ui';
import { getWeaponIconPath } from '@/shared/lib/constants/weaponIcons';
import type { WeaponType } from '@/stores/inventory/types';

interface Props {
  weaponType?: WeaponType;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  weaponType: null,
  size: 24,
});

const iconPath = computed(() => getWeaponIconPath(props.weaponType));
</script>
