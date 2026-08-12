import { describe, it, expect } from 'vitest';
import {
  isCharacterStatsData,
  isWeaponsData,
  isApparelData,
  isFoodData,
  isPotionsData,
  isIngredientsData,
  isScrollsData,
  isBooksData,
  isKeysData,
  isMiscData,
  isInventoryCategories,
  isWeaponItem,
  isAmmoItem,
  isApparelItem,
  isFoodItem,
  isPotionItem,
  isIngredientItem,
  isScrollItem,
  isBookItem,
  isKeyItem,
  isMiscItem,
  isGem,
  isMagicCategoriesData,
  isDestructionData,
  isAlterationData,
  isConjurationData,
  isIllusionData,
  isRestorationData,
  isEnchantingData,
  isShoutsData,
  isShoutItem,
  isSpellItem,
  isHotkeyItemsData,
  isQuestsData,
  isQuestListSection,
  isQuestJournalEntry,
  isGameStatusData,
  isMapHotspotsData,
  isMapQuestMarkersData,
  isPlayerPositionData,
} from '@/stores/adapters/typeGuards';

// =============================================================
// Data-level type guards (id-based)
// =============================================================

describe('isCharacterStatsData', () => {
  it('returns true for valid id and object data', () => {
    expect(isCharacterStatsData({ health: 100 }, 'character.stats')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isCharacterStatsData({ health: 100 }, 'character.other')).toBe(false);
  });

  it('returns false for null data', () => {
    expect(isCharacterStatsData(null, 'character.stats')).toBe(false);
  });

  it('returns false for non-object data', () => {
    expect(isCharacterStatsData('string', 'character.stats')).toBe(false);
    expect(isCharacterStatsData(42, 'character.stats')).toBe(false);
  });
});

describe('isWeaponsData', () => {
  it('returns true for valid id and object', () => {
    expect(isWeaponsData({ items: [] }, 'inventory.weapons')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isWeaponsData({ items: [] }, 'inventory.apparel')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isWeaponsData(null, 'inventory.weapons')).toBe(false);
  });
});

describe('isApparelData', () => {
  it('returns true for valid id and object', () => {
    expect(isApparelData({ items: [] }, 'inventory.apparel')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isApparelData({ items: [] }, 'inventory.weapons')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isApparelData(null, 'inventory.apparel')).toBe(false);
  });
});

describe('isFoodData', () => {
  it('returns true for valid id and object', () => {
    expect(isFoodData({ items: [] }, 'inventory.food')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isFoodData({ items: [] }, 'inventory.potions')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isFoodData(null, 'inventory.food')).toBe(false);
  });
});

describe('isPotionsData', () => {
  it('returns true for valid id and object', () => {
    expect(isPotionsData({ items: [] }, 'inventory.potions')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isPotionsData({ items: [] }, 'inventory.food')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPotionsData(null, 'inventory.potions')).toBe(false);
  });
});

describe('isIngredientsData', () => {
  it('returns true for valid id and object', () => {
    expect(isIngredientsData({ items: [] }, 'inventory.ingredients')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isIngredientsData({ items: [] }, 'inventory.scrolls')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isIngredientsData(null, 'inventory.ingredients')).toBe(false);
  });
});

describe('isScrollsData', () => {
  it('returns true for valid id and object', () => {
    expect(isScrollsData({ items: [] }, 'inventory.scrolls')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isScrollsData({ items: [] }, 'inventory.books')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isScrollsData(null, 'inventory.scrolls')).toBe(false);
  });
});

describe('isBooksData', () => {
  it('returns true for valid id and object', () => {
    expect(isBooksData({ items: [] }, 'inventory.books')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isBooksData({ items: [] }, 'inventory.keys')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isBooksData(null, 'inventory.books')).toBe(false);
  });
});

describe('isKeysData', () => {
  it('returns true for valid id and object', () => {
    expect(isKeysData({ items: [] }, 'inventory.keys')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isKeysData({ items: [] }, 'inventory.misc')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isKeysData(null, 'inventory.keys')).toBe(false);
  });
});

describe('isMiscData', () => {
  it('returns true for valid id and object', () => {
    expect(isMiscData({ items: [] }, 'inventory.misc')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isMiscData({ items: [] }, 'inventory.keys')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isMiscData(null, 'inventory.misc')).toBe(false);
  });
});

describe('isInventoryCategories', () => {
  it('returns true for valid categories data', () => {
    expect(isInventoryCategories({ categories: [{ categoryId: 'Weapon', count: 5, name: 'Weapons' }] }, 'inventory.categories')).toBe(true);
  });

  it('returns false when categories is missing', () => {
    expect(isInventoryCategories({}, 'inventory.categories')).toBe(false);
  });

  it('returns false when categories is not an array', () => {
    expect(isInventoryCategories({ categories: 'not-array' }, 'inventory.categories')).toBe(false);
  });

  it('returns false for wrong id', () => {
    expect(isInventoryCategories({ categories: [] }, 'magic.categories')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isInventoryCategories(null, 'inventory.categories')).toBe(false);
  });
});

// =============================================================
// Item-level type guards
// =============================================================

describe('isWeaponItem', () => {
  const validWeapon = {
    formId: '0x123',
    name: 'Iron Sword',
    categoryType: 'Weapon',
  };

  it('returns true for valid weapon item', () => {
    expect(isWeaponItem(validWeapon)).toBe(true);
  });

  it('returns false for non-object', () => {
    expect(isWeaponItem(null)).toBe(false);
    expect(isWeaponItem('string')).toBe(false);
  });

  it('returns false when formId is missing', () => {
    expect(isWeaponItem({ name: 'Sword', categoryType: 'Weapon' })).toBe(false);
  });

  it('returns false when name is missing', () => {
    expect(isWeaponItem({ formId: '0x123', categoryType: 'Weapon' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isWeaponItem({ formId: '0x123', name: 'Sword', categoryType: 'Apparel' })).toBe(false);
  });
});

describe('isAmmoItem', () => {
  const validAmmo = {
    formId: '0x456',
    name: 'Iron Arrow',
    categoryType: 'Ammo',
  };

  it('returns true for valid ammo item', () => {
    expect(isAmmoItem(validAmmo)).toBe(true);
  });

  it('returns false for non-object', () => {
    expect(isAmmoItem(null)).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isAmmoItem({ formId: '0x456', name: 'Arrow', categoryType: 'Weapon' })).toBe(false);
  });
});

describe('isApparelItem', () => {
  const validApparel = {
    formId: '0x789',
    name: 'Iron Helmet',
    bodySlots: ['Head'],
    categoryType: 'Apparel',
  };

  it('returns true for valid apparel item', () => {
    expect(isApparelItem(validApparel)).toBe(true);
  });

  it('returns false when bodySlots is missing', () => {
    expect(isApparelItem({ formId: '0x789', name: 'Helmet', categoryType: 'Apparel' })).toBe(false);
  });

  it('returns false when bodySlots is not an array', () => {
    expect(isApparelItem({ formId: '0x789', name: 'Helmet', bodySlots: 'Head', categoryType: 'Apparel' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isApparelItem({ formId: '0x789', name: 'Helmet', bodySlots: [], categoryType: 'Weapon' })).toBe(false);
  });
});

describe('isFoodItem', () => {
  const validFood = {
    formId: '0x111',
    name: 'Apple',
    effects: [],
    categoryType: 'Food',
  };

  it('returns true for valid food item', () => {
    expect(isFoodItem(validFood)).toBe(true);
  });

  it('returns false when effects is missing', () => {
    expect(isFoodItem({ formId: '0x111', name: 'Apple', categoryType: 'Food' })).toBe(false);
  });

  it('returns false when effects is not an array', () => {
    expect(isFoodItem({ formId: '0x111', name: 'Apple', effects: 'none', categoryType: 'Food' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isFoodItem({ formId: '0x111', name: 'Apple', effects: [], categoryType: 'Potion' })).toBe(false);
  });
});

describe('isPotionItem', () => {
  const validPotion = {
    formId: '0x222',
    name: 'Health Potion',
    effects: [],
    categoryType: 'Potion',
  };

  it('returns true for valid potion item', () => {
    expect(isPotionItem(validPotion)).toBe(true);
  });

  it('returns false when effects is missing', () => {
    expect(isPotionItem({ formId: '0x222', name: 'Potion', categoryType: 'Potion' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isPotionItem({ formId: '0x222', name: 'Potion', effects: [], categoryType: 'Food' })).toBe(false);
  });
});

describe('isIngredientItem', () => {
  const validIngredient = {
    formId: '0x333',
    name: 'Wheat',
    effects: [],
    categoryType: 'Ingredient',
  };

  it('returns true for valid ingredient item', () => {
    expect(isIngredientItem(validIngredient)).toBe(true);
  });

  it('returns false when effects is missing', () => {
    expect(isIngredientItem({ formId: '0x333', name: 'Wheat', categoryType: 'Ingredient' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isIngredientItem({ formId: '0x333', name: 'Wheat', effects: [], categoryType: 'Food' })).toBe(false);
  });
});

describe('isScrollItem', () => {
  const validScroll = {
    formId: '0x444',
    name: 'Fireball Scroll',
    effects: [],
    categoryType: 'Scroll',
  };

  it('returns true for valid scroll item', () => {
    expect(isScrollItem(validScroll)).toBe(true);
  });

  it('returns false when effects is missing', () => {
    expect(isScrollItem({ formId: '0x444', name: 'Scroll', categoryType: 'Scroll' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isScrollItem({ formId: '0x444', name: 'Scroll', effects: [], categoryType: 'Book' })).toBe(false);
  });
});

describe('isBookItem', () => {
  const validBook = {
    formId: '0x555',
    name: 'The Lusty Argonian Maid',
    description: 'A classic',
    categoryType: 'Book',
  };

  it('returns true for valid book item', () => {
    expect(isBookItem(validBook)).toBe(true);
  });

  it('returns false when description is missing', () => {
    expect(isBookItem({ formId: '0x555', name: 'Book', categoryType: 'Book' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isBookItem({ formId: '0x555', name: 'Book', description: 'text', categoryType: 'Scroll' })).toBe(false);
  });
});

describe('isKeyItem', () => {
  const validKey = {
    formId: '0x666',
    name: 'Whiterun Key',
    categoryType: 'Key',
  };

  it('returns true for valid key item', () => {
    expect(isKeyItem(validKey)).toBe(true);
  });

  it('returns false for non-object', () => {
    expect(isKeyItem(null)).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isKeyItem({ formId: '0x666', name: 'Key', categoryType: 'Misc' })).toBe(false);
  });
});

describe('isMiscItem', () => {
  const validMisc = {
    formId: '0x777',
    name: 'Basket',
    categoryType: 'Misc',
  };

  it('returns true for valid misc item', () => {
    expect(isMiscItem(validMisc)).toBe(true);
  });

  it('returns false for non-object', () => {
    expect(isMiscItem(null)).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isMiscItem({ formId: '0x777', name: 'Basket', categoryType: 'Key' })).toBe(false);
  });
});

describe('isGem', () => {
  const validGem = {
    formId: '0x888',
    name: 'Petty Soul Gem',
    capacity: 'Petty',
    containedSoul: 'None',
    categoryType: 'SoulGem',
  };

  it('returns true for valid gem item', () => {
    expect(isGem(validGem)).toBe(true);
  });

  it('returns false when capacity is missing', () => {
    expect(isGem({ formId: '0x888', name: 'Gem', containedSoul: 'None', categoryType: 'SoulGem' })).toBe(false);
  });

  it('returns false when containedSoul is missing', () => {
    expect(isGem({ formId: '0x888', name: 'Gem', capacity: 'Petty', categoryType: 'SoulGem' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isGem({ formId: '0x888', name: 'Gem', capacity: 'Petty', containedSoul: 'None', categoryType: 'Misc' })).toBe(false);
  });
});

// =============================================================
// Magic type guards
// =============================================================

describe('isMagicCategoriesData', () => {
  it('returns true for valid magic categories', () => {
    expect(isMagicCategoriesData({ categories: [{ categoryId: 'Destruction', count: 3, name: 'Destruction' }] }, 'magic.categories')).toBe(true);
  });

  it('returns false when categories is missing', () => {
    expect(isMagicCategoriesData({}, 'magic.categories')).toBe(false);
  });

  it('returns false when categories is not an array', () => {
    expect(isMagicCategoriesData({ categories: 'not-array' }, 'magic.categories')).toBe(false);
  });

  it('returns false for wrong id', () => {
    expect(isMagicCategoriesData({ categories: [] }, 'inventory.categories')).toBe(false);
  });
});

describe('isDestructionData', () => {
  it('returns true for valid id and object', () => {
    expect(isDestructionData({ items: [] }, 'magic.destruction')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isDestructionData({ items: [] }, 'magic.alteration')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isDestructionData(null, 'magic.destruction')).toBe(false);
  });
});

describe('isAlterationData', () => {
  it('returns true for valid id and object', () => {
    expect(isAlterationData({ items: [] }, 'magic.alteration')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isAlterationData({ items: [] }, 'magic.destruction')).toBe(false);
  });
});

describe('isConjurationData', () => {
  it('returns true for valid id and object', () => {
    expect(isConjurationData({ items: [] }, 'magic.conjuration')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isConjurationData({ items: [] }, 'magic.illusion')).toBe(false);
  });
});

describe('isIllusionData', () => {
  it('returns true for valid id and object', () => {
    expect(isIllusionData({ items: [] }, 'magic.illusion')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isIllusionData({ items: [] }, 'magic.restoration')).toBe(false);
  });
});

describe('isRestorationData', () => {
  it('returns true for valid id and object', () => {
    expect(isRestorationData({ items: [] }, 'magic.restoration')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isRestorationData({ items: [] }, 'magic.enchanting')).toBe(false);
  });
});

describe('isEnchantingData', () => {
  it('returns true for valid id and object', () => {
    expect(isEnchantingData({ items: [] }, 'magic.enchanting')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isEnchantingData({ items: [] }, 'magic.shouts')).toBe(false);
  });
});

describe('isShoutsData', () => {
  it('returns true for valid id and object', () => {
    expect(isShoutsData({ items: [] }, 'magic.shouts')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isShoutsData({ items: [] }, 'magic.destruction')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isShoutsData(null, 'magic.shouts')).toBe(false);
  });
});

describe('isShoutItem', () => {
  const validShout = {
    formId: '0x999',
    name: 'Fus Ro Dah',
    description: 'Unrelenting Force',
    words: [{ name: 'Fus', formId: '0x1', recoveryTime: 15, isKnown: true }],
  };

  it('returns true for valid shout item', () => {
    expect(isShoutItem(validShout)).toBe(true);
  });

  it('returns false when words is missing', () => {
    expect(isShoutItem({ formId: '0x999', name: 'Fus', description: 'Force' })).toBe(false);
  });

  it('returns false when words is not an array', () => {
    expect(isShoutItem({ formId: '0x999', name: 'Fus', description: 'Force', words: 'not-array' })).toBe(false);
  });

  it('returns false when description is missing', () => {
    expect(isShoutItem({ formId: '0x999', name: 'Fus', words: [] })).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isShoutItem(null)).toBe(false);
  });
});

describe('isSpellItem', () => {
  const validSpell = {
    formId: '0xAAA',
    name: 'Fireball',
    cost: 50,
    level: 25,
    effects: [],
  };

  it('returns true for valid spell item', () => {
    expect(isSpellItem(validSpell)).toBe(true);
  });

  it('returns false when cost is missing', () => {
    expect(isSpellItem({ formId: '0xAAA', name: 'Fireball', level: 25, effects: [] })).toBe(false);
  });

  it('returns false when level is missing', () => {
    expect(isSpellItem({ formId: '0xAAA', name: 'Fireball', cost: 50, effects: [] })).toBe(false);
  });

  it('returns false when effects is missing', () => {
    expect(isSpellItem({ formId: '0xAAA', name: 'Fireball', cost: 50, level: 25 })).toBe(false);
  });

  it('returns false when effects is not an array', () => {
    expect(isSpellItem({ formId: '0xAAA', name: 'Fireball', cost: 50, level: 25, effects: 'none' })).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isSpellItem(null)).toBe(false);
  });
});

// =============================================================
// Hotkeys, Quests, Game Status, Map type guards
// =============================================================

describe('isHotkeyItemsData', () => {
  it('returns true for valid hotkey items data', () => {
    expect(isHotkeyItemsData({ items: [] }, 'hotkeys.items')).toBe(true);
  });

  it('returns false when items is missing', () => {
    expect(isHotkeyItemsData({}, 'hotkeys.items')).toBe(false);
  });

  it('returns false when items is not an array', () => {
    expect(isHotkeyItemsData({ items: 'not-array' }, 'hotkeys.items')).toBe(false);
  });

  it('returns false for wrong id', () => {
    expect(isHotkeyItemsData({ items: [] }, 'hotkeys.other')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isHotkeyItemsData(null, 'hotkeys.items')).toBe(false);
  });
});

describe('isQuestsData', () => {
  it('returns true for valid quests data', () => {
    expect(isQuestsData({ quests: [] }, 'quests.questsList')).toBe(true);
  });

  it('returns false when quests is missing', () => {
    expect(isQuestsData({}, 'quests.questsList')).toBe(false);
  });

  it('returns false when quests is not an array', () => {
    expect(isQuestsData({ quests: 'not-array' }, 'quests.questsList')).toBe(false);
  });

  it('returns false for wrong id', () => {
    expect(isQuestsData({ quests: [] }, 'quests.other')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isQuestsData(null, 'quests.questsList')).toBe(false);
  });
});

describe('isQuestListSection', () => {
  it('returns true for valid section', () => {
    expect(isQuestListSection({ type: 'section', formId: 'misc' })).toBe(true);
  });

  it('returns false when type is not section', () => {
    expect(isQuestListSection({ type: 'quest', formId: '0x123' })).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isQuestListSection(null)).toBe(false);
    expect(isQuestListSection('string')).toBe(false);
  });
});

describe('isQuestJournalEntry', () => {
  const validQuest = {
    questFormId: '0xBBB',
    formId: '0xCCC',
    name: 'Dragon Rising',
    isActive: true,
    isMisc: false,
    steps: [],
  };

  it('returns true for valid quest entry', () => {
    expect(isQuestJournalEntry(validQuest)).toBe(true);
  });

  it('returns false when questFormId is missing', () => {
    const { questFormId: _, ...rest } = validQuest;
    expect(isQuestJournalEntry(rest)).toBe(false);
  });

  it('returns false when formId is missing', () => {
    const { formId: _, ...rest } = validQuest;
    expect(isQuestJournalEntry(rest)).toBe(false);
  });

  it('returns false when name is missing', () => {
    const { name: _, ...rest } = validQuest;
    expect(isQuestJournalEntry(rest)).toBe(false);
  });

  it('returns false when isActive is missing', () => {
    const { isActive: _, ...rest } = validQuest;
    expect(isQuestJournalEntry(rest)).toBe(false);
  });

  it('returns false when isMisc is missing', () => {
    const { isMisc: _, ...rest } = validQuest;
    expect(isQuestJournalEntry(rest)).toBe(false);
  });

  it('returns false when steps is missing', () => {
    const { steps: _, ...rest } = validQuest;
    expect(isQuestJournalEntry(rest)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isQuestJournalEntry(null)).toBe(false);
  });
});

describe('isGameStatusData', () => {
  it('returns true for valid game status data', () => {
    expect(isGameStatusData({ status: { canAct: true } }, 'game.status')).toBe(true);
  });

  it('returns false when status.canAct is missing', () => {
    expect(isGameStatusData({ status: {} }, 'game.status')).toBe(false);
  });

  it('returns false when status is not an object', () => {
    expect(isGameStatusData({ status: 'not-object' }, 'game.status')).toBe(false);
  });

  it('returns false for wrong id', () => {
    expect(isGameStatusData({ status: { canAct: true } }, 'game.other')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isGameStatusData(null, 'game.status')).toBe(false);
  });
});

describe('isMapHotspotsData', () => {
  it('returns true for valid hotspots data', () => {
    expect(isMapHotspotsData({ hot: [] }, 'map.hotspots')).toBe(true);
  });

  it('returns false when hot is missing', () => {
    expect(isMapHotspotsData({}, 'map.hotspots')).toBe(false);
  });

  it('returns false when hot is not an array', () => {
    expect(isMapHotspotsData({ hot: 'not-array' }, 'map.hotspots')).toBe(false);
  });

  it('returns false for wrong id', () => {
    expect(isMapHotspotsData({ hot: [] }, 'map.questMarkers')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isMapHotspotsData(null, 'map.hotspots')).toBe(false);
  });
});

describe('isMapQuestMarkersData', () => {
  it('returns true for valid quest markers data', () => {
    expect(isMapQuestMarkersData({ marker: [] }, 'map.questMarkers')).toBe(true);
  });

  it('returns false when marker is missing', () => {
    expect(isMapQuestMarkersData({}, 'map.questMarkers')).toBe(false);
  });

  it('returns false when marker is not an array', () => {
    expect(isMapQuestMarkersData({ marker: 'not-array' }, 'map.questMarkers')).toBe(false);
  });

  it('returns false for wrong id', () => {
    expect(isMapQuestMarkersData({ marker: [] }, 'map.hotspots')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isMapQuestMarkersData(null, 'map.questMarkers')).toBe(false);
  });
});

describe('isPlayerPositionData', () => {
  it('returns true for valid player position data', () => {
    expect(isPlayerPositionData({ position: { x: 100, y: 200, angle: 1.5 } }, 'map.player')).toBe(true);
  });

  it('returns false when position.x is missing', () => {
    expect(isPlayerPositionData({ position: { y: 200, angle: 1.5 } }, 'map.player')).toBe(false);
  });

  it('returns false when position.y is missing', () => {
    expect(isPlayerPositionData({ position: { x: 100, angle: 1.5 } }, 'map.player')).toBe(false);
  });

  it('returns false when position.angle is missing', () => {
    expect(isPlayerPositionData({ position: { x: 100, y: 200 } }, 'map.player')).toBe(false);
  });

  it('returns false when position is not an object', () => {
    expect(isPlayerPositionData({ position: 'not-object' }, 'map.player')).toBe(false);
  });

  it('returns false for wrong id', () => {
    expect(isPlayerPositionData({ position: { x: 100, y: 200, angle: 1.5 } }, 'map.hotspots')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPlayerPositionData(null, 'map.player')).toBe(false);
  });
});