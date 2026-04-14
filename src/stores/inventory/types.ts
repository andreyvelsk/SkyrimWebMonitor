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
  LIGHT_ARMOR: "Light",
  HEAVY_ARMOR: "Heavy",
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

export interface ItemEnchantmentEffect {
  description: string;
  descriptionTemplate: string;
  duration: number;
  magnitude: number;
  name: string;
}

export interface ItemEnchantment {
  effects: ItemEnchantmentEffect[];
  name: string;
}
 
export interface BaseItem {
  count: number;
  formId: string;
  isFavorite: boolean;
  isStolen: boolean;
  name: string;
  value: number;
  weight: number;
}

export interface WeaponItem extends BaseItem {
  baseDamage: number;
  damage: number;
  enchantment: ItemEnchantment | null;
  enchantmentCharge: number | null;
  equipSlots: EquipSlot[];
  equippedHand: EquippedHand;
  isEquipped: boolean;
  isTwoHanded: boolean;
  weaponType: WeaponType;
}

export interface WeaponsState {
  items?: WeaponItem[] | null;
}

export interface ApparelItem extends BaseItem {
  armorRating: number;
  armorType: ApparelType;
  armorTypeId?: string;
  baseArmorRating: number;
  bodySlots: string[];
  enchantment: ItemEnchantment | null;
  equipSlots: EquipSlot[];
  isEquipped: boolean;
}

export interface ApparelState {
  items?: ApparelItem[] | null;
}

export interface FoodItem extends BaseItem {
  effects: ItemEnchantmentEffect[];
}

export interface FoodState {
  items?: FoodItem[] | null;
}

export interface PotionItem extends BaseItem {
  effects: ItemEnchantmentEffect[];
}

export interface PotionsState {
  items?: PotionItem[] | null;
}

export interface KeyItem extends BaseItem {}

export interface KeysState {
  items?: KeyItem[] | null;
}

export interface BookItem extends BaseItem {
  description: string;
}

export interface BookState {
  items?: BookItem[] | null;
}

export interface ScrollItem extends BaseItem {
  effects: ItemEnchantmentEffect[];
}

export interface ScrollsState {
  items?: ScrollItem[] | null;
}

export interface IngredientItem extends BaseItem {
  effects: ItemEnchantmentEffect[];
}

export interface IngredientsState {
  items?: IngredientItem[] | null;
}

export interface GemItem extends BaseItem {
  capacity: string;
  containedSoul: string;
}

export interface MiscItem extends BaseItem {}

export interface MiscState {
  items?: MiscItem[] | null;
  gems?: GemItem[] | null;
}

export type InventoryItem = WeaponItem | ApparelItem | FoodItem | PotionItem | IngredientItem | BookItem | KeyItem | ScrollItem | MiscItem | GemItem;
