<template>
  <base-icon
    :icon-path="iconPath"
    :size="size"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseIcon } from '@/shared/ui';
import { getMagicSchoolIconPath } from '@/shared/lib/constants/magicSchoolIcons';

interface Props {
  spellSchool?: string | null;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  spellSchool: null,
  size: 24,
});

const iconPath = computed(() => getMagicSchoolIconPath(props.spellSchool));
</script>
