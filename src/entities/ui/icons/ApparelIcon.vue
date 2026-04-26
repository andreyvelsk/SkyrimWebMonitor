<template>
  <base-icon
    :icon-path="iconPath"
    :size="size"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseIcon } from '@/shared/ui';
import type { BodySlot } from '@/stores/inventory/types';
import { getApparelIconPath } from '@/shared/lib/constants/apparelIcons';

interface Props {
  bodySlots?: BodySlot[] | null;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  bodySlots: null,
  size: 24,
});

const iconPath = computed(() =>
  getApparelIconPath(props.bodySlots?.[0] ?? null)
);
</script>
