import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { WeaponsState, ApparelState, FoodState, BookState, KeysState, ScrollsState, IngredientsState } from './types';

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

  const weaponsList = computed(() => (weapons.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const apparelList = computed(() => (apparel.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const foodList = computed(() => (food.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const ingredientsList = computed(() => (ingredients.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const booksList = computed(() => (books.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const scrollsList = computed(() => (scrolls.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const keysList = computed(() => (keys.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const setWeapons = (newWeapons: WeaponsState) => {
    weapons.value = newWeapons;
  };

  const setApparel = (newApparel: ApparelState) => {
    apparel.value = newApparel;
  };

  const setFood = (newFood: FoodState) => {
    food.value = newFood;
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

  return {
    weapons,
    apparel,
    food,
    ingredients,
    keys,
    books,
    scrolls,
    weaponsList,
    apparelList,
    foodList,
    ingredientsList,
    keysList,
    booksList,
    scrollsList,
    setWeapons,
    setApparel,
    setFood,
    setIngredients,
    setKeys,
    setBooks,
    setScrolls,
  };
});
