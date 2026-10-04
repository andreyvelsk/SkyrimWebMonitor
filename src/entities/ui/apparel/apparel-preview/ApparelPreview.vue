<template>
  <base-preview
    :data="data"
    :stats="stats"
    :effects="data?.enchantment?.effects"
  >
    <template #icon>
      <item-thumbnail
        v-if="data"
        :fallback-icon-path="getApparelIconPath(data.bodySlots?.[0] ?? null)"
        :model-path="data.modelPath"
        :keywords="data.keywords"
        :size="ITEM_PREVIEW_THUMBNAIL_SIZE"
        expandable
        :name="data.name"
        framing="upright"
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
import { getApparelIconPath } from '@/shared/lib/constants/apparelIcons';
import { getRoundValue } from '@/shared/lib/utils/getDescriptionValues';
import type { ApparelItem } from '@/stores/inventory/lib/types';

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
      props.data?.armorRating ?? props.data?.armorRating
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
