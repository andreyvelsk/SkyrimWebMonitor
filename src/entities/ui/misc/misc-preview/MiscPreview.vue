<template>
  <base-preview
    :data="data"
    :stats="stats"
  >
    <template #icon>
      <item-thumbnail
        v-if="data"
        fallback-icon-path="lorc/swap-bag.svg"
        :model-path="data.modelPath"
        :keywords="data.keywords"
        framing="upright"
        :size="ITEM_PREVIEW_THUMBNAIL_SIZE"
        expandable
        :name="data.name"
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
import type { MiscItem } from '@/stores/inventory/lib/types';

const { t } = useI18n();

const props = defineProps<{
  data: MiscItem;
}>();

const stats = computed(() => [
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
