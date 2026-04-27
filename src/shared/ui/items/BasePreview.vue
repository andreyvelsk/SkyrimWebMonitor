<template>
  <div
    v-if="data"
    class="d-flex flex-col gap-md base-preview"
  >
    <div
      v-if="$slots.icon"
      class="d-flex justify-center"
    >
      <div class="relative">
        <slot name="icon" />
        <div
          v-if="isStolen"
          class="state-icons"
        >
          <base-icon
            icon-path="sbed/hand.svg"
            :size="14"
            class="steal-icon"
          />
        </div>
      </div>
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
import { computed } from 'vue';
import { BaseIcon } from '@/shared/ui';
import { getEffectHtml } from '@/shared/lib/utils/getEffectHtml';
import type { ItemEnchantmentEffect } from '@/shared/lib/types/common';
import type { ListItem } from '@/shared/lib/types/types';
import type { PreviewStats } from './types/types';

const props = withDefaults(
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

const isStolen = computed(() => {
  return 'isStolen' in props.data! && props.data!.isStolen;
});
</script>

<style scoped lang="scss">
/* Layout via utility classes; only inner typography is component-specific. */

.base-preview {
  height: 100%;
  max-height: 100%;
  min-height: 0;

  .state-icons {
    position: absolute;
    bottom: -0.25rem;
    right: -0.25rem;

    :deep(.steal-icon.base-icon) {
      background-color: var(--color-danger);
    }
  }

  .info {
    flex: 0 0 auto;

    .name {
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-xl);
      margin-bottom: 0.25rem;
    }

    .stat {
      color: var(--skyrim-text-secondary);
      font-size: var(--font-size-lg);

      strong {
        color: var(--skyrim-text-primary);
      }
    }
  }

  .enchantment {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .enchant {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .enchant-desc {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    color: var(--skyrim-text-secondary);
    font-size: var(--font-size-base);

    :deep(strong) {
      color: var(--skyrim-text-primary);
    }
  }
}
</style>
