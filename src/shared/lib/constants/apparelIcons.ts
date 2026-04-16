import { BODY_SLOTS, type BodySlot } from '@/stores/inventory/types';

export const APPAREL_ICON_PATHS: Record<BodySlot, string> = {
  [BODY_SLOTS.HEAD]: 'lorc/visored-helm.svg',
  [BODY_SLOTS.HAIR]: 'lorc/comb.svg',
  [BODY_SLOTS.LONG_HAIR]: 'lorc/laurel-crown.svg',
  [BODY_SLOTS.BODY]: 'lorc/armor-vest.svg',
  [BODY_SLOTS.HANDS]: 'lorc/mailed-fist.svg',
  [BODY_SLOTS.FOREARMS]: 'lorc/armoured-shell.svg',
  [BODY_SLOTS.AMULET]: 'lorc/gem-pendant.svg',
  [BODY_SLOTS.RING]: 'lorc/engagement-ring.svg',
  [BODY_SLOTS.FEET]: 'lorc/boots.svg',
  [BODY_SLOTS.CALVES]: 'lorc/trousers.svg',
  [BODY_SLOTS.SHIELD]: 'lorc/checked-shield.svg',
  [BODY_SLOTS.TAIL]: 'lorc/armadillo-tail.svg',
  [BODY_SLOTS.CIRCLET]: 'lorc/crown.svg',
  [BODY_SLOTS.EARS]: 'lorc/earwig.svg',
};

export function getApparelIconPath(slot?: BodySlot | null): string {
  if (!slot) {
    return APPAREL_ICON_PATHS[BODY_SLOTS.BODY];
  }
  return APPAREL_ICON_PATHS[slot] ?? APPAREL_ICON_PATHS[BODY_SLOTS.BODY];
}
