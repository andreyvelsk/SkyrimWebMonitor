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
  spellSchool?: string | null;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  spellSchool: null,
  size: 24,
});

// Маппинг школ магии на относительные пути иконок
const MAGIC_SCHOOL_ICON_PATHS: Record<string, string> = {
  Alteration: 'lorc/magic-swirl.svg',
  Conjuration: 'lorc/portal.svg',
  Destruction: 'lorc/flaming-claw.svg',
  Illusion: 'delapouite/sparkles.svg',
  Restoration: 'delapouite/nested-hearts.svg',
};

const iconPath = computed(() => {
  const relativePath = props.spellSchool
    ? MAGIC_SCHOOL_ICON_PATHS[props.spellSchool] ||
      MAGIC_SCHOOL_ICON_PATHS.Alteration
    : MAGIC_SCHOOL_ICON_PATHS.Alteration;
  return relativePath;
});
</script>
