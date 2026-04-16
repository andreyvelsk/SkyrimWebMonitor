import { BODY_SLOTS, type BodySlot } from '@/stores/inventory/types';

export const APPAREL_ICON_PATHS: Record<BodySlot, string> = {
  [BODY_SLOTS.HEAD]: 'caro-asercion/warlord-helmet.svg',
  [BODY_SLOTS.HAIR]: 'caro-asercion/warlord-helmet.svg',
  [BODY_SLOTS.LONG_HAIR]: 'caro-asercion/warlord-helmet.svg',
  [BODY_SLOTS.BODY]: 'lorc/lamellar.svg',
  [BODY_SLOTS.HANDS]: 'delapouite/gauntlet.svg',
  [BODY_SLOTS.FOREARMS]: 'delapouite/gauntlet.svg',
  [BODY_SLOTS.AMULET]: 'lorc/gem-chain.svg',
  [BODY_SLOTS.RING]: 'delapouite/ring.svg',
  [BODY_SLOTS.FEET]: 'delapouite/leg-armor.svg',
  [BODY_SLOTS.CALVES]: 'delapouite/leg-armor.svg',
  [BODY_SLOTS.SHIELD]: 'lorc/checked-shield.svg',
  [BODY_SLOTS.TAIL]: 'lorc/armadillo-tail.svg',
  [BODY_SLOTS.CIRCLET]: 'delapouite/tiara.svg',
  [BODY_SLOTS.EARS]: 'delapouite/earrings.svg',
};

export function getApparelIconPath(slot?: BodySlot | null): string {
  if (!slot) {
    return APPAREL_ICON_PATHS[BODY_SLOTS.BODY];
  }
  return APPAREL_ICON_PATHS[slot] ?? APPAREL_ICON_PATHS[BODY_SLOTS.BODY];
}
