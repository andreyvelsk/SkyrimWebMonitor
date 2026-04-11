export interface WeaponEnchantmentEffect {
  description: string;
  descriptionTemplate: string;
  duration: number;
  magnitude: number;
  name: string;
}

export interface WeaponEnchantment {
  effects: WeaponEnchantmentEffect[];
  name: string;
}

export interface WeaponItem {
  baseDamage: number;
  count: number;
  damage: number;
  enchantment: WeaponEnchantment | null;
  enchantmentCharge: number | null;
  formId: string;
  isEquipped: boolean;
  isFavorite: boolean;
  isStolen: boolean;
  name: string;
  value: number;
  weight: number;
}

export interface WeaponsState {
  items?: WeaponItem[] | null;
}

export interface ApparelState {
  items?: unknown[] | null;
}
