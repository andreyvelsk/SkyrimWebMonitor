<template>
  <base-preview
    :data="data"
    :stats="stats"
    :effects="data?.effects"
  >
    <template #icon>
      <magic-icon
        v-if="data"
        :spell-school="data.categoryType"
        :size="48"
      />
    </template>
  </base-preview>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MagicIcon } from '@/entities/ui';
import { BasePreview } from '@/shared/ui/items';
import { getRoundValue } from '@/shared/lib/utils/getDescriptionValues';
import type { SpellItem } from '@/stores/magic/types';

const { t: $t } = useI18n();

const props = withDefaults(
  defineProps<{
    data?: SpellItem | null;
  }>(),
  {
    data: null,
  }
);

const stats = computed(() => {
  if (!props.data) return [];
  return [
    {
      label: $t('entities.spell.level'),
      value: getLevelLabel(props.data.level),
    },
    {
      label: $t('entities.spell.cost'),
      value: getRoundValue(props.data.cost),
    },
  ];
});

function getLevelLabel(level: number): string {
  switch (level) {
    case 0:
      return $t('entities.spell.levels.novice');
    case 25:
      return $t('entities.spell.levels.apprentice');
    case 50:
      return $t('entities.spell.levels.adept');
    case 75:
      return $t('entities.spell.levels.expert');
    case 100:
      return $t('entities.spell.levels.master');
    default:
      return $t('entities.spell.levels.unknown');
  }
}
</script>
