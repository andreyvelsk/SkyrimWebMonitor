<template>
  <base-preview
    :data="data"
    :stats="stats"
    :effects="data?.enchantment?.effects"
  >
    <template #icon>
      <apparel-icon
        v-if="data"
        :body-slots="data.bodySlots"
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
import { getRoundValue } from '@/shared/lib/utils/getDescriptionValues';
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
    value: getRoundValue(
      props.data?.armorRating ?? props.data?.baseArmorRating
    ),
  },
  {
    label: t('pages.inventory.apparel.weight'),
    value: getRoundValue(props.data?.weight),
  },
  {
    label: t('pages.inventory.apparel.value'),
    value: getRoundValue(props.data?.value),
  },
]);
</script>
