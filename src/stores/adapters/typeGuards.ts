import type { CharacterStats } from '@/stores/character/lib/types';
import type {
  WeaponsState,
  ApparelState,
  FoodState,
  BookState,
  KeysState,
  IngredientsState,
  PotionsState,
  WeaponItem,
  ApparelItem,
  FoodItem,
  PotionItem,
  IngredientItem,
  BookItem,
  KeyItem,
  ScrollsState,
  ScrollItem,
  MiscState,
  MiscItem,
  GemItem,
  AmmoItem,
} from '@/stores/inventory/lib/types';
import { CATEGORY_TYPES } from '@/stores/inventory/lib/types';
import type { CategoriesData } from '@/shared/lib/types';
import type { MagicState, MagicSchoolState, SpellItem, ShoutsState, ShoutItem } from '@/stores/magic/lib/types';
import type { QuestsState, QuestJournalEntry, QuestListSection } from '@/stores/quests/lib/types';
import type { HotkeyItemsState } from '@/stores/hotkeys/lib/types';
import type { GameStatusData } from '@/stores/game/lib/types';
import type {
  MapHotspotsState,
  MapQuestMarkersState,
  PlayerPosition,
} from '@/stores/map/lib/types';

/** Type guard: narrows `unknown` to `Record<string, unknown>` for safe property access without `as`. */
function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null;
}

export function isCharacterStatsData(data: unknown, id: string): data is CharacterStats {
  return id === 'character.stats' && typeof data === 'object' && data !== null;
}

export function isWeaponsData(data: unknown, id: string): data is WeaponsState {
  return id === 'inventory.weapons' && typeof data === 'object' && data !== null;
}

export function isApparelData(data: unknown, id: string): data is ApparelState {
  return id === 'inventory.apparel' && typeof data === 'object' && data !== null;
}

export function isFoodData(data: unknown, id: string): data is FoodState {
  return id === 'inventory.food' && typeof data === 'object' && data !== null;
}

export function isPotionsData(data: unknown, id: string): data is PotionsState {
  return id === 'inventory.potions' && typeof data === 'object' && data !== null;
}

export function isIngredientsData(data: unknown, id: string): data is IngredientsState {
  return id === 'inventory.ingredients' && typeof data === 'object' && data !== null;
}

export function isScrollsData(data: unknown, id: string): data is ScrollsState {
  return id === 'inventory.scrolls' && typeof data === 'object' && data !== null;
}

export function isBooksData(data: unknown, id: string): data is BookState {
  return id === 'inventory.books' && typeof data === 'object' && data !== null;
}

export function isKeysData(data: unknown, id: string): data is KeysState {
  return id === 'inventory.keys' && typeof data === 'object' && data !== null;
}

export function isInventoryCategories(data: unknown, id: string): data is CategoriesData {
  return (
    id === 'inventory.categories' &&
    isRecord(data) &&
    'categories' in data &&
    Array.isArray(data.categories)
  );
}

export function isMiscData(data: unknown, id: string): data is MiscState {
  return id === 'inventory.misc' && typeof data === 'object' && data !== null;
}

export function isWeaponItem(item: unknown): item is WeaponItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    item.categoryType === CATEGORY_TYPES.WEAPON
  );
}

export function isAmmoItem(item: unknown): item is AmmoItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    item.categoryType === CATEGORY_TYPES.AMMO
  );
}

export function isApparelItem(item: unknown): item is ApparelItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    Array.isArray(item.bodySlots) &&
    item.categoryType === CATEGORY_TYPES.APPAREL
  );
}

export function isFoodItem(item: unknown): item is FoodItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    Array.isArray(item.effects) &&
    item.categoryType === CATEGORY_TYPES.FOOD
  );
}

export function isPotionItem(item: unknown): item is PotionItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    Array.isArray(item.effects) &&
    item.categoryType === CATEGORY_TYPES.POTION
  );
}

export function isIngredientItem(item: unknown): item is IngredientItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    Array.isArray(item.effects) &&
    item.categoryType === CATEGORY_TYPES.INGREDIENT
  );
}

export function isScrollItem(item: unknown): item is ScrollItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    Array.isArray(item.effects) &&
    item.categoryType === CATEGORY_TYPES.SCROLL
  );
}

export function isBookItem(item: unknown): item is BookItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.description === 'string' &&
    item.categoryType === CATEGORY_TYPES.BOOK
  );
}

export function isKeyItem(item: unknown): item is KeyItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    item.categoryType === CATEGORY_TYPES.KEY
  );
}

export function isMiscItem(item: unknown): item is MiscItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    item.categoryType === CATEGORY_TYPES.MISC
  );
}

export function isGem(item: unknown): item is GemItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.capacity === 'string' &&
    typeof item.containedSoul === 'string' &&
    item.categoryType === CATEGORY_TYPES.SOUL_GEM
  );
}

// Magic-related type guards
export function isMagicCategoriesData(data: unknown, id: string): data is { categories: MagicState['categories'] } {
  return (
    id === 'magic.categories' &&
    isRecord(data) &&
    'categories' in data &&
    Array.isArray(data.categories)
  );
}

export function isDestructionData(data: unknown, id: string): data is MagicSchoolState {
  return id === 'magic.destruction' && typeof data === 'object' && data !== null;
}

export function isAlterationData(data: unknown, id: string): data is MagicSchoolState {
  return id === 'magic.alteration' && typeof data === 'object' && data !== null;
}

export function isConjurationData(data: unknown, id: string): data is MagicSchoolState {
  return id === 'magic.conjuration' && typeof data === 'object' && data !== null;
}

export function isIllusionData(data: unknown, id: string): data is MagicSchoolState {
  return id === 'magic.illusion' && typeof data === 'object' && data !== null;
}

export function isRestorationData(data: unknown, id: string): data is MagicSchoolState {
  return id === 'magic.restoration' && typeof data === 'object' && data !== null;
}

export function isEnchantingData(data: unknown, id: string): data is MagicSchoolState {
  return id === 'magic.enchanting' && typeof data === 'object' && data !== null;
}

export function isShoutsData(data: unknown, id: string): data is ShoutsState {
  return id === 'magic.shouts' && typeof data === 'object' && data !== null;
}

export function isShoutItem(item: unknown): item is ShoutItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.description === 'string' &&
    Array.isArray(item.words)
  );
}

export function isSpellItem(item: unknown): item is SpellItem {
  if (!isRecord(item)) return false;
  return (
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.cost === 'number' &&
    typeof item.level === 'number' &&
    Array.isArray(item.effects)
  );
}

export function isHotkeyItemsData(data: unknown, id: string): data is HotkeyItemsState {
  return (
    id === 'hotkeys.items' &&
    isRecord(data) &&
    'items' in data &&
    Array.isArray(data.items)
  );
}

export function isQuestsData(data: unknown, id: string): data is QuestsState {
  return (
    id === 'quests.questsList' &&
    isRecord(data) &&
    'quests' in data &&
    Array.isArray(data.quests)
  );
}

export function isQuestListSection(item: unknown): item is QuestListSection {
  if (!isRecord(item)) return false;
  return item.type === 'section' && typeof item.formId === 'string';
}

export function isQuestJournalEntry(item: unknown): item is QuestJournalEntry {
  if (!isRecord(item)) return false;
  return (
    typeof item.questFormId === 'string' &&
    typeof item.formId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.isActive === 'boolean' &&
    typeof item.isMisc === 'boolean' &&
    Array.isArray(item.steps)
  );
}

export function isGameStatusData(data: unknown, id: string): data is GameStatusData {
  if (id !== 'game.status' || !isRecord(data)) return false;
  const status = data.status;
  if (!isRecord(status)) return false;
  return typeof status.canAct === 'boolean';
}

export function isMapHotspotsData(data: unknown, id: string): data is MapHotspotsState {
  return (
    id === 'map.hotspots' &&
    isRecord(data) &&
    'hot' in data &&
    Array.isArray(data.hot)
  );
}

export function isMapQuestMarkersData(
  data: unknown,
  id: string
): data is MapQuestMarkersState {
  return (
    id === 'map.questMarkers' &&
    isRecord(data) &&
    'marker' in data &&
    Array.isArray(data.marker)
  );
}

export function isPlayerPositionData(
  data: unknown,
  id: string
): data is { position: PlayerPosition } {
  if (id !== 'map.player' || !isRecord(data)) return false;
  const pos = data.position;
  if (!isRecord(pos)) return false;
  return (
    typeof pos.x === 'number' &&
    typeof pos.y === 'number' &&
    typeof pos.angle === 'number'
  );
}
