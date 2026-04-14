export const WEAPON_TYPES = {
  ONE_HAND_SWORD: "OneHandSword",
  ONE_HAND_DAGGER: "OneHandDagger",
  ONE_HAND_AXE: "OneHandAxe",
  ONE_HAND_MACE: "OneHandMace",
  TWO_HAND_SWORD: "TwoHandSword",
  TWO_HAND_AXE: "TwoHandAxe",
  BOW: "Bow",
  STAFF: "Staff",
  CROSSBOW: "Crossbow",
  HAND_TO_HAND: "HandToHand",
} as const;

export type WeaponType = (typeof WEAPON_TYPES)[keyof typeof WEAPON_TYPES] | null;

// Apparel type constants
export const APPAREL_TYPES = {
  CLOTHING: "Clothing",
  LIGHT_ARMOR: "LightArmor",
  HEAVY_ARMOR: "HeavyArmor",
  JEWELRY: "Jewelry",
  ACCESSORIES: "Accessories",
} as const;

export type ApparelType = (typeof APPAREL_TYPES)[keyof typeof APPAREL_TYPES] | null;

// Equip slot constants
export const EQUIP_SLOTS = {
  RIGHT: "right",
  LEFT: "left",
} as const;

export type EquipSlot = (typeof EQUIP_SLOTS)[keyof typeof EQUIP_SLOTS];

// Equipped hand constants
export const EQUIPPED_HANDS = {
  RIGHT: "right",
  LEFT: "left",
  BOTH: "both",
} as const;

export type EquippedHand = (typeof EQUIPPED_HANDS)[keyof typeof EQUIPPED_HANDS] | null;

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
  equipSlots: EquipSlot[];
  equippedHand: EquippedHand;
  formId: string;
  isEquipped: boolean;
  isFavorite: boolean;
  isStolen: boolean;
  isTwoHanded: boolean;
  name: string;
  value: number;
  weaponType: WeaponType;
  weight: number;
}

export interface WeaponsState {
  items?: WeaponItem[] | null;
}

export interface ApparelItem {
  count: number;
  enchantment: WeaponEnchantment | null;
  equipSlots: EquipSlot[];
  formId: string;
  isEquipped: boolean;
  isFavorite: boolean;
  isStolen: boolean;
  name: string;
  value: number;
  apparelType: ApparelType;
  weight: number;
}

export interface ApparelState {
  items?: ApparelItem[] | null;
}

export type InventoryItem = WeaponItem | ApparelItem;