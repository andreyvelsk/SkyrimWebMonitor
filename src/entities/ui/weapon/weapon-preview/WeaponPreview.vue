<template>
  <base-preview
    :data="data"
    :stats="stats"
    :effects="data?.enchantment?.effects"
  >
    <template #icon>
      <item-thumbnail
        v-if="data"
        :fallback-icon-path="getWeaponIconPath(data.weaponType)"
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
import { getWeaponIconPath } from '@/shared/lib/constants/weaponIcons';
import { getRoundValue } from '@/shared/lib/utils/getDescriptionValues';
import type { WeaponItem } from '@/stores/inventory/lib/types';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    data?: WeaponItem | null;
  }>(),
  {
    data: null,
  }
);

const stats = computed(() => [
  {
    label: t('pages.inventory.weapons.damage'),
    value: getRoundValue(props.data?.damage ?? props.data?.damage),
  },
  {
    label: t('pages.inventory.weapons.weight'),
    value: getRoundValue(props.data?.weight),
  },
  {
    label: t('pages.inventory.weapons.value'),
    value: getRoundValue(props.data?.value),
  },
]);
</script>
