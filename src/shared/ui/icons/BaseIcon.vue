<template>
  <div
    class="base-icon"
    :style="{
      '--icon-src': `url('${iconSrc}')`,
      '--icon-size': `${size}px`,
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
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  flipped: false,
});

const iconSrc = computed(() => buildIconPath(props.iconPath));
</script>

<style scoped lang="scss">
.base-icon {
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

  &--flipped {
    transform: scaleX(-1);
  }
}
</style>
