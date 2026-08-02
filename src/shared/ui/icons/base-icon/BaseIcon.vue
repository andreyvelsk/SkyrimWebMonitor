<template>
  <div
    class="base-icon"
    :style="{
      '--icon-src': `url('${iconSrc}')`,
      '--icon-size': `${size}px`,
      '--icon-bg-color': backgroundColor,
    }"
    :class="{ 'base-icon--flipped': flipped }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { buildIconPath } from '@/shared/lib/utils/iconPath';

interface Props {
  iconPath: string;
  size?: number;
  flipped?: boolean;
  backgroundColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  flipped: false,
  backgroundColor: 'var(--skyrim-text-accent)',
});

const iconSrc = computed(() => buildIconPath(props.iconPath));
const backgroundColor = computed(() => props.backgroundColor);
</script>

<style scoped lang="scss">
.base-icon {
  display: block;
  width: var(--icon-size);
  height: var(--icon-size);
  background-color: var(--icon-bg-color);
  transition: background-color var(--transition-fast);
  mask-image: var(--icon-src);
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;

  &--flipped {
    transform: scaleX(-1);
  }
}
</style>
