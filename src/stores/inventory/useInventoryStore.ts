import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { WeaponsState, ApparelState, FoodState, BookState } from './types';

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

  // State for inventory/books page
  const books = ref<BookState>({
    items: undefined,
  });

  const weaponsList = computed(() => (weapons.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const apparelList = computed(() => (apparel.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const foodList = computed(() => (food.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const booksList = computed(() => (books.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const setWeapons = (newWeapons: WeaponsState) => {
    weapons.value = newWeapons;
  };

  const setApparel = (newApparel: ApparelState) => {
    apparel.value = newApparel;
  };

  const setFood = (newFood: FoodState) => {
    food.value = newFood;
  };

  const setBooks = (newBooks: BookState) => {
    books.value = newBooks;
  };

  return {
    weapons,
    apparel,
    food,
    books,
    weaponsList,
    apparelList,
    foodList,
    booksList,
    setWeapons,
    setApparel,
    setFood,
    setBooks,
  };
});
