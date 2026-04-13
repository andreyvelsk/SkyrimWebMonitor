import { WEAPON_TYPES, type WeaponType } from '@/stores/inventory/types';

// Таблица соответствия типов оружия с иконками
export const WEAPON_TYPE_ICONS: Record<Exclude<WeaponType, null>, string> = {
  [WEAPON_TYPES.ONE_HAND_SWORD]: 'sword',
  [WEAPON_TYPES.ONE_HAND_DAGGER]: 'dagger',
  [WEAPON_TYPES.ONE_HAND_AXE]: 'axe',
  [WEAPON_TYPES.ONE_HAND_MACE]: 'mace',
  [WEAPON_TYPES.TWO_HAND_SWORD]: 'sword2',
  [WEAPON_TYPES.TWO_HAND_AXE]: 'axe2',
  [WEAPON_TYPES.BOW]: 'bow',
  [WEAPON_TYPES.STAFF]: 'wand2',
  [WEAPON_TYPES.CROSSBOW]: 'crossbow',
  [WEAPON_TYPES.HAND_TO_HAND]: 'fist',
};

export function getWeaponIcon(weaponType: WeaponType): string {
  if (!weaponType) return 'sword';
  return WEAPON_TYPE_ICONS[weaponType] || 'sword';
}
