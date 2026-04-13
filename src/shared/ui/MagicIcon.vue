<template>
  <img
    :src="iconSrc"
    :alt="spellSchool || 'magic'"
    :width="size"
    :height="size"
    class="magic-icon"
  >
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { buildIconPath } from '@/shared/lib/utils/iconPath';

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
  Alteration: 'lorc/wizard-staff.svg',
  Conjuration: 'lorc/energy-sword.svg',
  Destruction: 'lorc/rune-sword.svg',
  Illusion: 'lorc/shining-sword.svg',
  Restoration: 'lorc/holy-symbol.svg',
  Mysticism: 'lorc/spinning-sword.svg',
};

const iconSrc = computed(() => {
  const relativePath = props.spellSchool
    ? MAGIC_SCHOOL_ICON_PATHS[props.spellSchool] || MAGIC_SCHOOL_ICON_PATHS.Mysticism
    : MAGIC_SCHOOL_ICON_PATHS.Mysticism;
  return buildIconPath(relativePath);
});
</script>

<style scoped lang="scss">
.magic-icon {
  display: block;
  object-fit: contain;
  image-rendering: crisp-edges;
}
</style>
