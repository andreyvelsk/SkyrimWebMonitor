<template>
  <base-preview
    :data="data"
    :stats="stats"
  >
    <template #icon>
      <base-icon icon-path="skoll/pestle-mortar.svg" :size="48" />
    </template>
  </base-preview>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BasePreview } from '@/shared/ui/items';
import { BaseIcon } from '@/shared/ui';
import { getRoundValue } from '@/shared/lib/utils/getDescriptionValues';
import type { IngredientItem } from '@/stores/inventory/types';

const { t } = useI18n();

const props = defineProps<{
  data: IngredientItem;
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
