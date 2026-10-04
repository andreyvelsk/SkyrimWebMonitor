<template>
  <base-preview
    :data="data"
    :stats="stats"
  >
    <template #icon>
      <item-thumbnail
        v-if="data"
        fallback-icon-path="lorc/arrow-cluster.svg"
        :model-path="data.modelPath"
        :keywords="data.keywords"
        :size="ITEM_PREVIEW_THUMBNAIL_SIZE"
        expandable
        :name="data.name"
        framing="diagonal"
      />
    </template>
  </base-preview>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BasePreview } from '@/shared/ui/items';
import { ItemThumbnail } from '@/entities/ui/icons';
import { ITEM_PREVIEW_THUMBNAIL_SIZE } from '@/shared/lib/constants/itemThumbnails';
import { getRoundValue } from '@/shared/lib/utils/getDescriptionValues';
import type { AmmoItem } from '@/stores/inventory/lib/types';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    data?: AmmoItem | null;
  }>(),
  {
    data: null,
  }
);

const stats = computed(() => [
  {
    label: t('pages.inventory.weapons.damage'),
    value: getRoundValue(props.data?.damage),
  },
  {
    label: t('common.weight'),
    value: getRoundValue(props.data?.weight),
  },
  {
    label: t('common.value'),
    value: getRoundValue(props.data?.value),
  },
]);
</script>
