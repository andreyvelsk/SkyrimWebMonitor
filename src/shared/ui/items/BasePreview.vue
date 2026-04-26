<template>
  <div
    v-if="data"
    class="d-flex flex-col gap-md base-preview"
  >
    <div
      v-if="$slots.icon"
      class="d-flex justify-center"
    >
      <slot name="icon" />
    </div>
    <div class="info">
      <div class="name">
        {{ data.name ?? $t('common.unknown') }}
      </div>

      <div
        v-if="stats.length"
        class="d-flex flex-col stats"
      >
        <span
          v-for="stat in stats"
          :key="stat.label"
          class="stat"
        >
          {{ stat.label }}:
          <strong>{{ stat.value ?? '—' }}</strong>
        </span>
      </div>
    </div>

    <slot name="effect">
      <div
        v-if="effects && effects.length"
        class="enchantment"
      >
        <div class="enchant">
          <div
            class="enchant-desc"
            v-html="getEffectHtml(effects)"
          />
        </div>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { getEffectHtml } from '@/shared/lib/utils/getEffectHtml';
import type { ItemEnchantmentEffect } from '@/shared/lib/types/common';
import type { ListItem } from '@/shared/lib/types/types';
import type { PreviewStats } from './types/types';

withDefaults(
  defineProps<{
    data?: ListItem | null;
    stats?: PreviewStats[];
    effects?: ItemEnchantmentEffect[];
  }>(),
  {
    data: null,
    stats: () => [],
    effects: () => [],
  }
);
</script>

<style scoped lang="scss">
/* Layout via utility classes; only inner typography is component-specific. */

.base-preview {
  .info {
    .name {
      font-weight: 600;
      font-size: var(--font-size-lg);
      margin-bottom: 0.25rem;
    }

    .stat {
      color: var(--skyrim-text-secondary);
      font-size: var(--font-size-base);

      strong {
        color: var(--skyrim-text-primary);
      }
    }
  }

  .enchant-desc {
    color: var(--skyrim-text-secondary);
    font-size: var(--font-size-sm);

    :deep(strong) {
      color: var(--skyrim-text-primary);
    }
  }
}
</style>
