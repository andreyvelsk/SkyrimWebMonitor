<template>
  <!-- Both hands icon for two-handed -->
  <div
    v-if="equippedHand === 'both'"
    class="both-hands"
  >
    <base-icon
      icon-path="sbed/hand.svg"
      :size="8"
      :flipped="true"
    />
    <base-icon
      icon-path="sbed/hand.svg"
      :size="8"
    />
  </div>
  <!-- Single hand -->
  <base-icon
    v-else-if="equippedHand"
    icon-path="sbed/hand.svg"
    :size="12"
    :flipped="equippedHand === 'left'"
  />
</template>

<script setup lang="ts">
import { BaseIcon } from '@/shared/ui';
import type { EquippedHand } from '@/stores/inventory/types';

interface Props {
  equippedHand?: EquippedHand;
}

withDefaults(defineProps<Props>(), {
  equippedHand: null,
});
</script>

<style scoped lang="scss">
.both-hands {
  display: flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
}
</style>
