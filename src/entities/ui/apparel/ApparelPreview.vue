<template>
  <base-preview
    :data="data"
    :stats="stats"
  >
    <template #icon>
      <apparel-icon
        v-if="data"
        :apparel-type="data.armorType"
        :size="48"
      />
    </template>
  </base-preview>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BasePreview } from '@/shared/ui/items';
import { ApparelIcon } from '@/entities/ui';
import type { ApparelItem } from '@/stores/inventory/types';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    data?: ApparelItem | null;
  }>(),
  {
    data: null,
  }
);

const stats = computed(() => [
  {
    label: t('pages.inventory.apparel.armorRating'),
    value: props.data?.armorRating ?? props.data?.baseArmorRating ?? '—',
  },
  {
    label: t('pages.inventory.apparel.weight'),
    value: props.data?.weight ?? '—',
  },
  {
    label: t('pages.inventory.apparel.value'),
    value: props.data?.value ?? '—',
  },
]);
</script>
