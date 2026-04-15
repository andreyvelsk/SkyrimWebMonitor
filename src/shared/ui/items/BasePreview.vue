<template>
  <div
    v-if="data"
    class="base-preview"
  >
    <div
      v-if="$slots.icon"
      class="flex justify-center"
    >
      <slot name="icon" />
    </div>
    <div class="info">
      <div class="name">
        {{ data.name ?? $t('common.unknown') }}
      </div>

      <div
        v-if="stats.length"
        class="stats"
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

    <div
      v-if="
        'enchantment' in data &&
          data.enchantment &&
          data.enchantment.effects &&
          data.enchantment.effects.length
      "
      class="enchantment"
    >
      <div class="enchant">
        <div
          class="enchant-desc"
          v-html="getEffectHtml(data.enchantment.effects)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getEffectHtml } from '@/shared/lib/utils/getEffectHtml';
import type { InventoryItem } from '@/stores/inventory/types';

interface Stat {
  label: string;
  value: string | number | null | undefined;
}

withDefaults(
  defineProps<{
    data?: InventoryItem | null;
    stats?: Stat[];
  }>(),
  {
    data: null,
    stats: () => [],
  }
);
</script>

<style scoped lang="scss">
.base-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  .info {
    .name {
      font-weight: 600;
      font-size: var(--font-size-lg);
      margin-bottom: 0.25rem;
    }

    .stats {
      display: flex;
      flex-direction: column;

      .stat {
        color: var(--skyrim-text-secondary);
        font-size: var(--font-size-base);

        strong {
          color: var(--skyrim-text-primary);
        }
      }
    }
  }

  .enchant-desc {
    color: var(--skyrim-text-secondary);
    font-size: var(--font-size-sm);

    ::v-deep strong {
      color: var(--skyrim-text-primary);
    }
  }
}
</style>
