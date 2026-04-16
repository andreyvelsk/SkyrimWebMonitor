<template>
  <base-icon
    :icon-path="iconPath"
    :size="size"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseIcon } from '@/shared/ui';
import type { BodySlot } from '@/stores/inventory/types';

interface Props {
  bodySlots?: BodySlot[] | null;
  size?: number;
}

const props = withDefaults(defineProps<Props>(), {
  bodySlots: null,
  size: 24,
});

// Иконка по умолчанию
const DEFAULT_ICON = 'lorc/armor-vest.svg';

// Маппинг типов брони на относительные пути иконок (использует фай лы из public/icons/lorc)
const APPAREL_ICON_PATHS: Record<string, string> = {
  Head: 'caro-asercion/warlord-helmet.svg',
  Hair: 'caro-asercion/warlord-helmet.svg',
  LongHair: 'caro-asercion/warlord-helmet.svg',
  Body: 'lorc/lamellar.svg',
  Hands: 'delapouite/gauntlet.svg',
  Forearms: 'delapouite/gauntlet.svg',
  Amulet: 'lorc/gem-chain.svg',
  Ring: 'delapouite/ring.svg',
  Feet: 'delapouite/leg-armor.svg',
  Calves: 'delapouite/leg-armor.svg',
  Shield: 'lorc/checked-shield.svg',
  Tail: 'lorc/armadillo-tail.svg',
  Circlet: 'delapouite/tiara.svg',
  Ears: 'delapouite/earrings.svg',
  Outfit: 'lorc/robe.svg',
};

const iconPath = computed(() => {
  const slot = props.bodySlots && props.bodySlots.length > 0 ? props.bodySlots[0] : undefined;
  if (!slot) return DEFAULT_ICON;
  return APPAREL_ICON_PATHS[slot] ?? DEFAULT_ICON;
});
</script>
