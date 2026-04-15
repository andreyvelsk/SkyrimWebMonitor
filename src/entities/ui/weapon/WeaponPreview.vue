<template>
  <div
    v-if="data"
    class="weapon-preview"
  >
    <div class="flex justify-center">
      <weapon-icon
        :weapon-type="data.weaponType"
        :size="48"
      />
    </div>
    <div class="info">
      <div class="name">
        {{ data.name ?? $t('pages.inventory.weapons.unknown') }}
      </div>

      <div class="stats">
        <span class="stat">{{ $t('pages.inventory.weapons.damage') }}: <strong>{{ data.damage ?? data.baseDamage ?? '—' }}</strong></span>
        <span class="stat">{{ $t('pages.inventory.weapons.weight') }}: <strong>{{ data.weight ?? '—' }}</strong></span>
        <span class="stat">{{ $t('pages.inventory.weapons.value') }}: <strong>{{ data.value ?? '—' }}</strong></span>
      </div>
    </div>

    <div
      v-if="data.enchantment && data.enchantment.effects && data.enchantment.effects.length"
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
import { WeaponIcon } from '@/entities/ui';
import { getEffectHtml } from '@/shared/lib/utils/getEffectHtml';
import type { WeaponItem } from '@/stores/inventory/types';

withDefaults(defineProps<{
  data?: WeaponItem | null;
}>(), {
  data: null,
});
</script>

<style scoped lang="scss">
.weapon-preview {
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
