<template>
  <base-preview
    :data="data"
    :stats="stats"
  >
    <template #icon>
      <magic-icon
        v-if="data"
        spell-school="Shouts"
        :size="48"
      />
    </template>

    <template #effect>
      <div
        v-if="data?.description"
        class="enchantment"
      >
        <div class="enchant">
          <div class="enchant-desc">
            {{ data.description }}
          </div>
        </div>
      </div>
    </template>
  </base-preview>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { MagicIcon } from '@/entities/ui';
import { BasePreview } from '@/shared/ui/items';
import type { ShoutItem } from '@/stores/magic/types';

const { t: $t } = useI18n();

const props = withDefaults(
  defineProps<{
    data?: ShoutItem | null;
  }>(),
  {
    data: null,
  }
);

const stats = computed(() => {
  if (!props.data) return [];
  const knownCount = props.data.words.filter((w) => w.isKnown).length;
  return [
    {
      label: $t('entities.shout.wordsKnown'),
      value: `${knownCount} / ${props.data.words.length}`,
    },
  ];
});
</script>