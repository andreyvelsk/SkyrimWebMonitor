// Magic school categories
export const MAGIC_SCHOOLS = {
  DESTRUCTION: 'Destruction',
  ALTERATION: 'Alteration',
  CONJURATION: 'Conjuration',
  ILLUSION: 'Illusion',
  RESTORATION: 'Restoration',
  ENCHANTING: 'Enchanting',
} as const;

export type MagicSchool = (typeof MAGIC_SCHOOLS)[keyof typeof MAGIC_SCHOOLS];

// Spell casting types
export const CASTING_TYPES = {
  CONSTANT_EFFECT: 'ConstantEffect',
  FIRE_AND_FORGET: 'FireAndForget',
  CONCENTRATION: 'Concentration',
  SCROLL: 'Scroll',
} as const;

export type CastingType = (typeof CASTING_TYPES)[keyof typeof CASTING_TYPES];

// Spell delivery methods
export const DELIVERY_TYPES = {
  SELF: 'Self',
  TOUCH: 'Touch',
  AIMED: 'Aimed',
  TARGET_ACTOR: 'TargetActor',
  TARGET_LOCATION: 'TargetLocation',
} as const;

export type DeliveryType = (typeof DELIVERY_TYPES)[keyof typeof DELIVERY_TYPES];

// Spell levels based on school skill requirement
export const SPELL_LEVELS = {
  NOVICE: 0,
  APPRENTICE: 25,
  ADEPT: 50,
  EXPERT: 75,
  MASTER: 100,
} as const;

// Equipped hand constants
export const EQUIPPED_HANDS = {
  RIGHT: 'right',
  LEFT: 'left',
  BOTH: 'both',
} as const;

export type EquippedHand = (typeof EQUIPPED_HANDS)[keyof typeof EQUIPPED_HANDS] | null;

// Equip slot constants
export const EQUIP_SLOTS = {
  RIGHT: 'right',
  LEFT: 'left',
} as const;

export type EquipSlot = (typeof EQUIP_SLOTS)[keyof typeof EQUIP_SLOTS];

// Spell effect object (from server)
export interface SpellEffect {
  name: string;
  magnitude: number;
  duration: number;
  descriptionTemplate: string;
  description: string;
}

// Spell item object (from server for each school)
export interface SpellItem {
  name: string;
  formId: string;
  categoryType: MagicSchool;
  cost: number;
  costValue: number;
  level: number;
  castingType: CastingType;
  delivery: DeliveryType;
  range: number;
  chargeTime: number;
  effects: SpellEffect[];
  isEquipped: boolean;
  equippedHand: EquippedHand;
  isActive: boolean;
  hotkeys: number[];
}

// Magic category from server
export interface MagicCategory {
  categoryId: MagicSchool;
  name: string;
  count: number;
}

// State for each magic school
export interface MagicSchoolState {
  items?: SpellItem[] | null;
}

// State for all magic categories and items
export interface MagicState {
  categories?: MagicCategory[] | null;
  destruction?: MagicSchoolState;
  alteration?: MagicSchoolState;
  conjuration?: MagicSchoolState;
  illusion?: MagicSchoolState;
  restoration?: MagicSchoolState;
  enchanting?: MagicSchoolState;
}

// Type for checking if a spell is master level
export function isMasterLevelSpell(spell: SpellItem): boolean {
  return spell.level >= SPELL_LEVELS.MASTER;
}

// Type guard to get effective equipped hand for UI purposes
export function getEffectiveEquippedHand(spell: SpellItem): EquippedHand {
  if (isMasterLevelSpell(spell) && spell.isEquipped) {
    return 'both';
  }
  return spell.equippedHand;
}
