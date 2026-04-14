import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { WeaponsState, ApparelState, FoodState, BookState, KeysState, ScrollsState, IngredientsState, PotionsState, MiscState } from './types';

export const useInventoryStore = defineStore('inventory', () => {
  // State for inventory/weapons page
  const weapons = ref<WeaponsState>({
    items: undefined,
  });

  // State for inventory/apparel page
  const apparel = ref<ApparelState>({
    items: undefined,
  });

  // State for inventory/food page
  const food = ref<FoodState>({
    items: undefined,
  });

  // State for inventory/potions page
  const potions = ref<PotionsState>({
    items: undefined,
  });

  // State for inventory/ingredients page
  const ingredients = ref<IngredientsState>({
    items: undefined,
  });

  // State for inventory/books page
  const books = ref<BookState>({
    items: undefined,
  });

  // State for inventory/scrolls page
  const scrolls = ref<ScrollsState>({
    items: undefined,
  });

  // State for inventory/keys page
  const keys = ref<KeysState>({
    items: undefined,
  });

  // State for inventory/misc page
  const misc = ref<MiscState>({
    items: undefined,
  });

  const weaponsList = computed(() => (weapons.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const apparelList = computed(() => (apparel.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const foodList = computed(() => (food.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const potionsList = computed(() => (potions.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const ingredientsList = computed(() => (ingredients.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const booksList = computed(() => (books.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const scrollsList = computed(() => (scrolls.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const keysList = computed(() => (keys.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const miscList = computed(() => (misc.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const setWeapons = (newWeapons: WeaponsState) => {
    weapons.value = newWeapons;
  };

  const setApparel = (newApparel: ApparelState) => {
    apparel.value = newApparel;
  };

  const setFood = (newFood: FoodState) => {
    food.value = newFood;
  };

  const setPotions = (newPotions: PotionsState) => {
    potions.value = newPotions;
  };

  const setIngredients = (newIngredients: IngredientsState) => {
    ingredients.value = newIngredients;
  };

  const setBooks = (newBooks: BookState) => {
    books.value = newBooks;
  };

  const setScrolls = (newScrolls: ScrollsState) => {
    scrolls.value = newScrolls;
  };

  const setKeys = (newKeys: KeysState) => {
    keys.value = newKeys;
  };

  const setMisc = (newMisc: MiscState) => {
    misc.value = newMisc;
  };

  return {
    weapons,
    apparel,
    misc,
    potions,
    food,
    ingredients,
    keys,
    books,
    scrolls,
    weaponsList,
    apparelList,
    miscList,
    potionsList,
    foodList,
    ingredientsList,
    keysList,
    booksList,
    scrollsList,
    setWeapons,
    setApparel,
    setMisc,
    setPotions,
    setFood,
    setIngredients,
    setKeys,
    setBooks,
    setScrolls,
  };
});
