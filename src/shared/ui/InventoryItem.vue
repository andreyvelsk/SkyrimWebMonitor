<template>
  <div
    class="inv-item"
    :class="{ equipped: isEquipped }"
  >
    <div class="inv-icon">
      <equipped-hand-icon
        v-if="isEquipped"
        :equipped-hand="equippedHand"
      />
    </div>
    <div class="inv-info">
      <span class="inv-name">{{ name }}</span>
    </div>
    <div>
      <weapon-icon
        v-if="weaponType"
        :weapon-type="weaponType"
      />
    </div>

    <div class="font-heading">
      {{ quantity }}
    </div>
  </div>
</template>

<script setup lang="ts">
import WeaponIcon from './WeaponIcon.vue';
import EquippedHandIcon from './EquippedHandIcon.vue';
import type { WeaponType, EquippedHand } from '@/stores/inventory/types';

defineProps<{
  name: string;
  isEquipped?: boolean;
  equippedHand?: EquippedHand;
  quantity?: number;
  weaponType?: WeaponType;
}>();
</script>

<style scoped lang="scss">
.inv-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);

  &.active {
    background-color: rgb(201 162 39 / 8%);
    border-color: var(--skyrim-accent-gold-dim);
  }

  &.equipped {
    border-left: 3px solid var(--skyrim-accent-gold);
  }
}

.inv-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  & svg {
    width: 16px;
    height: 16px;
    color: var(--skyrim-accent-gold);
  }
}

.inv-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inv-name {
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  color: var(--skyrim-text-primary);
}

.inv-desc {
  font-size: var(--font-size-xs);
  color: var(--skyrim-text-secondary);
}

.inv-qty {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-accent-gold);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--skyrim-bg-dark);
  border-radius: var(--radius-sm);
}
</style>
