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
  ScrollsState, 
  ScrollItem, 
  MiscState, 
  GemItem,
  AmmoItem,
} from '@/stores/inventory/types';
import type { CategoriesData } from '@/shared/lib/types/types';

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
    typeof weapon.damage === 'number' &&
    'weaponType' in weapon
  );
}

export function isAmmoItem(item: unknown): item is AmmoItem {
  if (typeof item !== 'object' || item === null) return false;
  const ammo = item as Record<string, unknown>;
  return (
    typeof ammo.formId === 'string' &&
    typeof ammo.name === 'string' &&
    'isEquipped' in ammo
  );
}

export function isApparelItem(item: unknown): item is ApparelItem {
  if (typeof item !== 'object' || item === null) return false;
  const apparel = item as Record<string, unknown>;
  return (
    typeof apparel.formId === 'string' &&
    typeof apparel.name === 'string' &&
    'armorType' in apparel
  );
}

export function isFoodItem(item: unknown): item is FoodItem {
  if (typeof item !== 'object' || item === null) return false;
  const food = item as Record<string, unknown>;
  return (
    typeof food.formId === 'string' &&
    typeof food.name === 'string' &&
    Array.isArray(food.effects)
  );
}

export function isPotionItem(item: unknown): item is PotionItem {
  if (typeof item !== 'object' || item === null) return false;
  const potion = item as Record<string, unknown>;
  return (
    typeof potion.formId === 'string' &&
    typeof potion.name === 'string' &&
    Array.isArray(potion.effects)
  );
}

export function isIngredientItem(item: unknown): item is IngredientItem {
  if (typeof item !== 'object' || item === null) return false;
  const ing = item as Record<string, unknown>;
  return (
    typeof ing.formId === 'string' &&
    typeof ing.name === 'string' &&
    Array.isArray(ing.effects)
  );
}

export function isScrollItem(item: unknown): item is ScrollItem {
  if (typeof item !== 'object' || item === null) return false;
  const scroll = item as Record<string, unknown>;
  return (
    typeof scroll.formId === 'string' &&
    typeof scroll.name === 'string' &&
    Array.isArray(scroll.effects)
  );
}

export function isBookItem(item: unknown): item is BookItem {
  if (typeof item !== 'object' || item === null) return false;
  const book = item as Record<string, unknown>;
  return (
    typeof book.formId === 'string' &&
    typeof book.name === 'string' &&
    typeof book.description === 'string'
  );
}

export function isGem(item: unknown): item is GemItem {
  if (typeof item !== 'object' || item === null) return false;
  const gem = item as Record<string, unknown>;
  return (
    typeof gem.formId === 'string' &&
    typeof gem.name === 'string' &&
    typeof gem.capacity === 'string' &&
    typeof gem.containedSoul === 'string'
  );
}
