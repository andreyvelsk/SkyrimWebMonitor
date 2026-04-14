import type { CharacterStats } from '@/stores/character/types';
import type { WeaponsState, ApparelState, FoodState, BookState, WeaponItem, ApparelItem, FoodItem, BookItem } from '@/stores/inventory/types';
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

export function isBooksData(data: unknown, id: string): data is BookState {
  return id === 'inventory.books' && typeof data === 'object' && data !== null;
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

export function isBookItem(item: unknown): item is BookItem {
  if (typeof item !== 'object' || item === null) return false;
  const book = item as Record<string, unknown>;
  return (
    typeof book.formId === 'string' &&
    typeof book.name === 'string' &&
    typeof book.description === 'string'
  );
}
