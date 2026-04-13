import { WEAPON_TYPES, type WeaponType } from '@/stores/inventory/types';

// Таблица соответствия типов оружия с относительными путями иконок
export const WEAPON_ICON_PATHS: Record<Exclude<WeaponType, null>, string> = {
  [WEAPON_TYPES.ONE_HAND_SWORD]: 'lorc/piercing-sword.svg',
  [WEAPON_TYPES.ONE_HAND_DAGGER]: 'lorc/plain-dagger.svg',
  [WEAPON_TYPES.ONE_HAND_AXE]: 'lorc/battered-axe.svg',
  [WEAPON_TYPES.ONE_HAND_MACE]: 'lorc/spiked-mace.svg',
  [WEAPON_TYPES.TWO_HAND_SWORD]: 'lorc/crossed-swords.svg',
  [WEAPON_TYPES.TWO_HAND_AXE]: 'lorc/battle-axe.svg',
  [WEAPON_TYPES.BOW]: 'lorc/pocket-bow.svg',
  [WEAPON_TYPES.STAFF]: 'lorc/wizard-staff.svg',
  [WEAPON_TYPES.CROSSBOW]: 'lorc/bowman.svg',
  [WEAPON_TYPES.HAND_TO_HAND]: 'lorc/mailed-fist.svg',
};

export function getWeaponIconPath(weaponType: WeaponType): string {
  if (!weaponType) {
    return WEAPON_ICON_PATHS[WEAPON_TYPES.ONE_HAND_SWORD];
  }
  return WEAPON_ICON_PATHS[weaponType];
}
