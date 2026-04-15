<template>
  <base-icon
    :icon-path="iconPath"
    :size="size"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseIcon } from '@/shared/ui';

interface Props {
  apparelType?: string | null;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  apparelType: null,
  size: 24,
});

// Маппинг типов брони на относительные пути иконок
const APPAREL_ICON_PATHS: Record<string, string> = {
  Head: 'lorc/battle-axe.svg',
  Hair: 'lorc/mailed-fist.svg',
  Body: 'lorc/crossed-swords.svg',
  Hands: 'lorc/mailed-fist.svg',
  Feet: 'lorc/stone-axe.svg',
  Outfit: 'lorc/piercing-sword.svg',
  Jewelry: 'lorc/spiked-mace.svg',
};

const iconPath = computed(() => {
  const relativePath =
    props.apparelType && APPAREL_ICON_PATHS[props.apparelType]
      ? APPAREL_ICON_PATHS[props.apparelType]
      : APPAREL_ICON_PATHS.Body;
  return relativePath;
});
</script>
