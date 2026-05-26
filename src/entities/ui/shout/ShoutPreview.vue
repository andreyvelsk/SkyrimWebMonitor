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

      <div
        v-if="data?.words?.length"
        class="words"
      >
        <div
          v-for="(word, index) in data.words"
          :key="word.formId"
          class="word"
          :class="{ 'word--unknown': !word.isKnown }"
        >
          <span class="word-index">{{ index + 1 }}.</span>
          <span class="word-name">{{ word.name }}</span>
          <span
            v-if="word.isKnown && word.recoveryTime"
            class="word-recovery"
          >{{ word.recoveryTime }}{{ $t('entities.shout.seconds') }}</span>
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

<style scoped lang="scss">
.words {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background-color: var(--skyrim-bg-dark);
  border: 1px solid var(--skyrim-border-dark);
}

.word {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-primary);

  &.word--unknown {
    color: var(--skyrim-text-muted);
    opacity: 0.5;
  }
}

.word-index {
  color: var(--skyrim-text-muted);
  font-size: var(--font-size-xs);
}

.word-name {
  font-weight: bold;
  flex: 1;
}

.word-recovery {
  font-size: var(--font-size-xs);
  color: var(--skyrim-text-secondary);
}
</style>
