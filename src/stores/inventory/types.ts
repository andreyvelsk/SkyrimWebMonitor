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

export type ArmorType = (typeof APPAREL_TYPES)[keyof typeof APPAREL_TYPES] | null;

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

// Category types (per Inventory.md `categoryType`)
export const CATEGORY_TYPES = {
  WEAPON: "Weapon",
  APPAREL: "Apparel",
  BOOK: "Book",
  POTION: "Potion",
  FOOD: "Food",
  INGREDIENT: "Ingredient",
  MISC: "Misc",
  AMMO: "Ammo",
  KEY: "Key",
  SOUL_GEM: "SoulGem",
  SCROLL: "Scroll",
} as const;

export type CategoryType = (typeof CATEGORY_TYPES)[keyof typeof CATEGORY_TYPES];

// Body-slot identifiers for apparel
export const BODY_SLOTS = {
  HEAD: "Head",
  HAIR: "Hair",
  BODY: "Body",
  HANDS: "Hands",
  FOREARMS: "Forearms",
  AMULET: "Amulet",
  RING: "Ring",
  FEET: "Feet",
  CALVES: "Calves",
  SHIELD: "Shield",
  TAIL: "Tail",
  LONG_HAIR: "LongHair",
  CIRCLET: "Circlet",
  EARS: "Ears",
} as const;

export type BodySlot = (typeof BODY_SLOTS)[keyof typeof BODY_SLOTS];

// Soul gem capacity values
export const SOUL_GEM_CAPACITIES = {
  PETTY: "Petty",
  LESSER: "Lesser",
  COMMON: "Common",
  GREATER: "Greater",
  GRAND: "Grand",
  NONE: "None",
} as const;

export type SoulGemCapacity = (typeof SOUL_GEM_CAPACITIES)[keyof typeof SOUL_GEM_CAPACITIES];

// Ingredient-specific effect shape
export interface IngredientEffect {
  name: string;
  known: boolean;
}

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
  categoryType: CategoryType;
  isFavorite: boolean;
  isStolen: boolean;
  name: string;
  value: number;
  weight: number;
}

export interface WeaponItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['WEAPON'];
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

export interface AmmoItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['AMMO'];
  isEquipped: boolean;
}

export interface WeaponsState {
  items?: WeaponItem[] | null;
  ammo?: AmmoItem[] | null;
}

export interface ApparelItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['APPAREL'];
  armorRating: number;
  armorType: ArmorType;
  armorTypeId?: string;
  baseArmorRating: number;
  bodySlots: BodySlot[];
  enchantment: ItemEnchantment | null;
  equipSlots: EquipSlot[];
  isEquipped: boolean;
}

export interface ApparelState {
  items?: ApparelItem[] | null;
}

export interface FoodItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['FOOD'];
  effects: ItemEnchantmentEffect[];
}

export interface FoodState {
  items?: FoodItem[] | null;
}

export interface PotionItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['POTION'];
  effects: ItemEnchantmentEffect[];
}

export interface PotionsState {
  items?: PotionItem[] | null;
}

export interface KeyItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['KEY'];
}

export interface KeysState {
  items?: KeyItem[] | null;
}

export interface BookItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['BOOK'];
  description: string;
}

export interface BookState {
  items?: BookItem[] | null;
}

export interface ScrollItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['SCROLL'];
  effects: ItemEnchantmentEffect[];
}

export interface ScrollsState {
  items?: ScrollItem[] | null;
}

export interface IngredientItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['INGREDIENT'];
  effects: IngredientEffect[];
}

export interface IngredientsState {
  items?: IngredientItem[] | null;
}

export interface GemItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['SOUL_GEM'];
  capacity: SoulGemCapacity;
  containedSoul: SoulGemCapacity;
}

export interface MiscItem extends BaseItem {
  categoryType: (typeof CATEGORY_TYPES)['MISC'];
}

export interface MiscState {
  items?: MiscItem[] | null;
  gems?: GemItem[] | null;
}

export type WeaponInventoryItem = WeaponItem | AmmoItem;

export type MiscInventoryItem = MiscItem | GemItem;

export type InventoryItem = WeaponInventoryItem | ApparelItem | FoodItem | PotionItem | IngredientItem | BookItem | KeyItem | ScrollItem | MiscInventoryItem;
