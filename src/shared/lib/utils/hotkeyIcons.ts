import type { HotkeySlotEntry } from '@/stores/hotkeys/types';
import type { CategoryType } from '@/stores/inventory/types';

/**
 * Icons shown in hotkey slot corner / picker button.
 * Mapped per category / spell school to stay DRY.
 * Spells use the same icons as MagicIcon school mapping.
 */
const CATEGORY_ICON_PATHS: Record<string, string> = {
  Weapon: 'lorc/crossed-swords.svg',
  Ammo: 'lorc/arrow-cluster.svg',
  Apparel: 'lorc/lamellar.svg',
  Book: 'lorc/book-cover.svg',
  Potion: 'lorc/round-bottom-flask.svg',
  Food: 'lorc/meat.svg',
  Ingredient: 'skoll/pestle-mortar.svg',
  Misc: 'lorc/swap-bag.svg',
  Key: 'lorc/key.svg',
  SoulGem: 'lorc/crystal-shine.svg',
  Scroll: 'lorc/scroll-unfurled.svg',
  Unknown: 'lorc/cog.svg',
};

const MAGIC_SCHOOL_ICON_PATHS: Record<string, string> = {
  Alteration: 'lorc/magic-swirl.svg',
  Conjuration: 'lorc/portal.svg',
  Destruction: 'lorc/flaming-claw.svg',
  Illusion: 'delapouite/sparkles.svg',
  Restoration: 'delapouite/nested-hearts.svg',
};

const SPELL_TYPE_FALLBACK: Record<string, string> = {
  Shout: 'lorc/shouting.svg',
  VoicePower: 'lorc/shouting.svg',
  Power: 'lorc/star-swirl.svg',
  LesserPower: 'lorc/star-swirl.svg',
};

const FALLBACK_ICON = 'lorc/cog.svg';

export function getCategoryIconPath(categoryType: CategoryType | 'Unknown' | undefined | null): string {
  if (!categoryType) return FALLBACK_ICON;
  return CATEGORY_ICON_PATHS[categoryType] ?? FALLBACK_ICON;
}

export function getHotkeyIconPath(entry: HotkeySlotEntry | null | undefined): string | null {
  if (!entry || !entry.bound) return null;
  if (entry.kind === 'item') {
    return getCategoryIconPath(entry.categoryType);
  }
  // spell
  const schoolIcon = MAGIC_SCHOOL_ICON_PATHS[entry.school];
  if (schoolIcon) return schoolIcon;
  return SPELL_TYPE_FALLBACK[entry.spellType] ?? FALLBACK_ICON;
}
