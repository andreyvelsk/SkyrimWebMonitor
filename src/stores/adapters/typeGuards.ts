import type { CharacterStats } from '@/stores/character/types';
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
} from '@/stores/inventory/types';
import { CATEGORY_TYPES } from '@/stores/inventory/types';
import type { CategoriesData } from '@/shared/lib/types/types';
import type { MagicState, MagicSchoolState, SpellItem } from '@/stores/magic/types';
import type { HotkeyItemsState } from '@/stores/hotkeys/types';
import type { GameStatusData } from '@/stores/game/types';
import type {
  MapHotspotsState,
  MapQuestMarkersState,
  PlayerPosition,
} from '@/stores/map/types';

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
    typeof data === 'object' &&
    data !== null &&
    'categories' in data &&
    Array.isArray((data as CategoriesData).categories)
  );
}

export function isMiscData(data: unknown, id: string): data is MiscState {
  return id === 'inventory.misc' && typeof data === 'object' && data !== null;
}

export function isWeaponItem(item: unknown): item is WeaponItem {
  if (typeof item !== 'object' || item === null) return false;
  const weapon = item as Record<string, unknown>;
  return (
    typeof weapon.formId === 'string' &&
    typeof weapon.name === 'string' &&
    weapon.categoryType === CATEGORY_TYPES.WEAPON
  );
}

export function isAmmoItem(item: unknown): item is AmmoItem {
  if (typeof item !== 'object' || item === null) return false;
  const ammo = item as Record<string, unknown>;
  return (
    typeof ammo.formId === 'string' &&
    typeof ammo.name === 'string' &&
    ammo.categoryType === CATEGORY_TYPES.AMMO
  );
}

export function isApparelItem(item: unknown): item is ApparelItem {
  if (typeof item !== 'object' || item === null) return false;
  const apparel = item as Record<string, unknown>;
  return (
    typeof apparel.formId === 'string' &&
    typeof apparel.name === 'string' &&
    Array.isArray(apparel.bodySlots) &&
    apparel.categoryType === CATEGORY_TYPES.APPAREL
  );
}

export function isFoodItem(item: unknown): item is FoodItem {
  if (typeof item !== 'object' || item === null) return false;
  const food = item as Record<string, unknown>;
  return (
    typeof food.formId === 'string' &&
    typeof food.name === 'string' &&
    Array.isArray(food.effects) &&
    food.categoryType === CATEGORY_TYPES.FOOD
  );
}

export function isPotionItem(item: unknown): item is PotionItem {
  if (typeof item !== 'object' || item === null) return false;
  const potion = item as Record<string, unknown>;
  return (
    typeof potion.formId === 'string' &&
    typeof potion.name === 'string' &&
    Array.isArray(potion.effects) &&
    potion.categoryType === CATEGORY_TYPES.POTION
  );
}

export function isIngredientItem(item: unknown): item is IngredientItem {
  if (typeof item !== 'object' || item === null) return false;
  const ing = item as Record<string, unknown>;
  return (
    typeof ing.formId === 'string' &&
    typeof ing.name === 'string' &&
    Array.isArray(ing.effects) &&
    ing.categoryType === CATEGORY_TYPES.INGREDIENT
  );
}

export function isScrollItem(item: unknown): item is ScrollItem {
  if (typeof item !== 'object' || item === null) return false;
  const scroll = item as Record<string, unknown>;
  return (
    typeof scroll.formId === 'string' &&
    typeof scroll.name === 'string' &&
    Array.isArray(scroll.effects) &&
    scroll.categoryType === CATEGORY_TYPES.SCROLL
  );
}

export function isBookItem(item: unknown): item is BookItem {
  if (typeof item !== 'object' || item === null) return false;
  const book = item as Record<string, unknown>;
  return (
    typeof book.formId === 'string' &&
    typeof book.name === 'string' &&
    typeof book.description === 'string' &&
    book.categoryType === CATEGORY_TYPES.BOOK
  );
}

export function isKeyItem(item: unknown): item is KeyItem {
  if (typeof item !== 'object' || item === null) return false;
  const key = item as Record<string, unknown>;
  return (
    typeof key.formId === 'string' &&
    typeof key.name === 'string' &&
    key.categoryType === CATEGORY_TYPES.KEY
  );
}

export function isMiscItem(item: unknown): item is MiscItem {
  if (typeof item !== 'object' || item === null) return false;
  const misc = item as Record<string, unknown>;
  return (
    typeof misc.formId === 'string' &&
    typeof misc.name === 'string' &&
    misc.categoryType === CATEGORY_TYPES.MISC
  );
}

export function isGem(item: unknown): item is GemItem {
  if (typeof item !== 'object' || item === null) return false;
  const gem = item as Record<string, unknown>;
  return (
    typeof gem.formId === 'string' &&
    typeof gem.name === 'string' &&
    typeof gem.capacity === 'string' &&
    typeof gem.containedSoul === 'string' &&
    gem.categoryType === CATEGORY_TYPES.SOUL_GEM
  );
}

// Magic-related type guards
export function isMagicCategoriesData(data: unknown, id: string): data is { categories: MagicState['categories'] } {
  return (
    id === 'magic.categories' &&
    typeof data === 'object' &&
    data !== null &&
    'categories' in data &&
    Array.isArray((data as { categories?: unknown }).categories)
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

export function isSpellItem(item: unknown): item is SpellItem {
  if (typeof item !== 'object' || item === null) return false;
  const spell = item as Record<string, unknown>;
  return (
    typeof spell.formId === 'string' &&
    typeof spell.name === 'string' &&
    typeof spell.cost === 'number' &&
    typeof spell.level === 'number' &&
    Array.isArray(spell.effects)
  );
}

export function isHotkeyItemsData(data: unknown, id: string): data is HotkeyItemsState {
  return (
    id === 'hotkeys.items' &&
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as HotkeyItemsState).items)
  );
}

export function isGameStatusData(data: unknown, id: string): data is GameStatusData {
  if (id !== 'game.status' || typeof data !== 'object' || data === null) return false;
  const status = (data as { status?: unknown }).status;
  return typeof status === 'object' && status !== null && typeof (status as { canAct?: unknown }).canAct === 'boolean';
}

export function isMapHotspotsData(data: unknown, id: string): data is MapHotspotsState {
  return (
    id === 'map.hotspots' &&
    typeof data === 'object' &&
    data !== null &&
    'hot' in data &&
    Array.isArray((data as MapHotspotsState).hot)
  );
}

export function isMapQuestMarkersData(
  data: unknown,
  id: string
): data is MapQuestMarkersState {
  return (
    id === 'map.questMarkers' &&
    typeof data === 'object' &&
    data !== null &&
    'marker' in data &&
    Array.isArray((data as MapQuestMarkersState).marker)
  );
}

export function isPlayerPositionData(
  data: unknown,
  id: string
): data is { position: PlayerPosition } {
  if (id !== 'map.player' || typeof data !== 'object' || data === null) return false;
  const pos = (data as { position?: unknown }).position;
  if (typeof pos !== 'object' || pos === null) return false;
  const p = pos as Record<string, unknown>;
  return (
    typeof p.x === 'number' &&
    typeof p.y === 'number' &&
    typeof p.angle === 'number'
  );
}
