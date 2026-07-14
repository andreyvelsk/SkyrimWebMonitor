import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { MagicSchoolState, MagicCategory } from './types';

export const useMagicStore = defineStore('magic', () => {
  // State for magic categories
  const categories = ref<MagicCategory[] | undefined>(undefined);

  // State for each magic school
  const destruction = ref<MagicSchoolState>({
    items: undefined,
  });

  const alteration = ref<MagicSchoolState>({
    items: undefined,
  });

  const conjuration = ref<MagicSchoolState>({
    items: undefined,
  });

  const illusion = ref<MagicSchoolState>({
    items: undefined,
  });

  const restoration = ref<MagicSchoolState>({
    items: undefined,
  });

  const enchanting = ref<MagicSchoolState>({
    items: undefined,
  });

  // Computed lists for each school
  const destructionList = computed(() => (destruction.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const alterationList = computed(() => (alteration.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const conjurationList = computed(() => (conjuration.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const illusionList = computed(() => (illusion.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const restorationList = computed(() => (restoration.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));
  const enchantingList = computed(() => (enchanting.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  // Setters
  const setCategories = (newCategories: MagicCategory[] | undefined) => {
    categories.value = newCategories;
  };

  const setDestruction = (newSpells: MagicSchoolState) => {
    destruction.value = newSpells;
  };

  const setAlteration = (newSpells: MagicSchoolState) => {
    alteration.value = newSpells;
  };

  const setConjuration = (newSpells: MagicSchoolState) => {
    conjuration.value = newSpells;
  };

  const setIllusion = (newSpells: MagicSchoolState) => {
    illusion.value = newSpells;
  };

  const setRestoration = (newSpells: MagicSchoolState) => {
    restoration.value = newSpells;
  };

  const setEnchanting = (newSpells: MagicSchoolState) => {
    enchanting.value = newSpells;
  };

  return {
    categories,
    destruction,
    alteration,
    conjuration,
    illusion,
    restoration,
    enchanting,
    destructionList,
    alterationList,
    conjurationList,
    illusionList,
    restorationList,
    enchantingList,
    setCategories,
    setDestruction,
    setAlteration,
    setConjuration,
    setIllusion,
    setRestoration,
    setEnchanting,
  };
});
