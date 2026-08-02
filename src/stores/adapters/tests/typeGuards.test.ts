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

// ============================================================
// Data-level type guards (id-based)
// ============================================================

describe('isCharacterStatsData', () => {
  it('returns true for valid id and object data', () => {
    expect(isCharacterStatsData({}, 'character.stats')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isCharacterStatsData({}, 'character.wrong')).toBe(false);
  });

  it('returns false for null data', () => {
    expect(isCharacterStatsData(null, 'character.stats')).toBe(false);
  });

  it('returns false for non-object data', () => {
    expect(isCharacterStatsData('string', 'character.stats')).toBe(false);
    expect(isCharacterStatsData(42, 'character.stats')).toBe(false);
    expect(isCharacterStatsData(undefined, 'character.stats')).toBe(false);
  });
});

describe('isWeaponsData', () => {
  it('returns true for valid id and object data', () => {
    expect(isWeaponsData({}, 'inventory.weapons')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isWeaponsData({}, 'inventory.apparel')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isWeaponsData(null, 'inventory.weapons')).toBe(false);
  });
});

describe('isApparelData', () => {
  it('returns true for valid id and object data', () => {
    expect(isApparelData({}, 'inventory.apparel')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isApparelData({}, 'inventory.weapons')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isApparelData(null, 'inventory.apparel')).toBe(false);
  });
});

describe('isFoodData', () => {
  it('returns true for valid id and object data', () => {
    expect(isFoodData({}, 'inventory.food')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isFoodData({}, 'inventory.potions')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isFoodData(null, 'inventory.food')).toBe(false);
  });
});

describe('isPotionsData', () => {
  it('returns true for valid id and object data', () => {
    expect(isPotionsData({}, 'inventory.potions')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isPotionsData({}, 'inventory.food')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPotionsData(null, 'inventory.potions')).toBe(false);
  });
});

describe('isIngredientsData', () => {
  it('returns true for valid id and object data', () => {
    expect(isIngredientsData({}, 'inventory.ingredients')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isIngredientsData({}, 'inventory.scrolls')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isIngredientsData(null, 'inventory.ingredients')).toBe(false);
  });
});

describe('isScrollsData', () => {
  it('returns true for valid id and object data', () => {
    expect(isScrollsData({}, 'inventory.scrolls')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isScrollsData({}, 'inventory.books')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isScrollsData(null, 'inventory.scrolls')).toBe(false);
  });
});

describe('isBooksData', () => {
  it('returns true for valid id and object data', () => {
    expect(isBooksData({}, 'inventory.books')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isBooksData({}, 'inventory.keys')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isBooksData(null, 'inventory.books')).toBe(false);
  });
});

describe('isKeysData', () => {
  it('returns true for valid id and object data', () => {
    expect(isKeysData({}, 'inventory.keys')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isKeysData({}, 'inventory.misc')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isKeysData(null, 'inventory.keys')).toBe(false);
  });
});

describe('isMiscData', () => {
  it('returns true for valid id and object data', () => {
    expect(isMiscData({}, 'inventory.misc')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isMiscData({}, 'inventory.keys')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isMiscData(null, 'inventory.misc')).toBe(false);
  });
});

describe('isInventoryCategories', () => {
  it('returns true for valid categories data', () => {
    expect(isInventoryCategories({ categories: ['Weapon', 'Apparel'] }, 'inventory.categories')).toBe(true);
  });

  it('returns true for empty categories array', () => {
    expect(isInventoryCategories({ categories: [] }, 'inventory.categories')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isInventoryCategories({ categories: [] }, 'inventory.wrong')).toBe(false);
  });

  it('returns false when categories is missing', () => {
    expect(isInventoryCategories({}, 'inventory.categories')).toBe(false);
  });

  it('returns false when categories is not an array', () => {
    expect(isInventoryCategories({ categories: 'not-array' }, 'inventory.categories')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isInventoryCategories(null, 'inventory.categories')).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isInventoryCategories('string', 'inventory.categories')).toBe(false);
  });
});

// ============================================================
// Item-level type guards
// ============================================================

describe('isWeaponItem', () => {
  const validWeapon = { formId: '0x123', name: 'Iron Sword', categoryType: 'Weapon' };

  it('returns true for valid weapon item', () => {
    expect(isWeaponItem(validWeapon)).toBe(true);
  });

  it('returns false when formId is missing', () => {
    expect(isWeaponItem({ name: 'Iron Sword', categoryType: 'Weapon' })).toBe(false);
  });

  it('returns false when name is missing', () => {
    expect(isWeaponItem({ formId: '0x123', categoryType: 'Weapon' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isWeaponItem({ formId: '0x123', name: 'Iron Sword', categoryType: 'Apparel' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isWeaponItem(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isWeaponItem('string')).toBe(false);
  });
});

describe('isAmmoItem', () => {
  const validAmmo = { formId: '0x456', name: 'Iron Arrow', categoryType: 'Ammo' };

  it('returns true for valid ammo item', () => {
    expect(isAmmoItem(validAmmo)).toBe(true);
  });

  it('returns false for wrong categoryType', () => {
    expect(isAmmoItem({ ...validAmmo, categoryType: 'Weapon' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAmmoItem(null)).toBe(false);
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
    expect(isApparelItem({ formId: '0x789', name: 'Iron Helmet', categoryType: 'Apparel' })).toBe(false);
  });

  it('returns false when bodySlots is not an array', () => {
    expect(isApparelItem({ ...validApparel, bodySlots: 'Head' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isApparelItem({ ...validApparel, categoryType: 'Weapon' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isApparelItem(null)).toBe(false);
  });
});

describe('isFoodItem', () => {
  const validFood = {
    formId: '0xabc',
    name: 'Apple',
    effects: ['Restore Health'],
    categoryType: 'Food',
  };

  it('returns true for valid food item', () => {
    expect(isFoodItem(validFood)).toBe(true);
  });

  it('returns false when effects is missing', () => {
    expect(isFoodItem({ formId: '0xabc', name: 'Apple', categoryType: 'Food' })).toBe(false);
  });

  it('returns false when effects is not an array', () => {
    expect(isFoodItem({ ...validFood, effects: 'Restore Health' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isFoodItem({ ...validFood, categoryType: 'Potion' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isFoodItem(null)).toBe(false);
  });
});

describe('isPotionItem', () => {
  const validPotion = {
    formId: '0xdef',
    name: 'Health Potion',
    effects: ['Restore Health'],
    categoryType: 'Potion',
  };

  it('returns true for valid potion item', () => {
    expect(isPotionItem(validPotion)).toBe(true);
  });

  it('returns false for wrong categoryType', () => {
    expect(isPotionItem({ ...validPotion, categoryType: 'Food' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPotionItem(null)).toBe(false);
  });
});

describe('isIngredientItem', () => {
  const validIngredient = {
    formId: '0x111',
    name: 'Blue Mountain Flower',
    effects: ['Restore Health', 'Fortify Conjuration'],
    categoryType: 'Ingredient',
  };

  it('returns true for valid ingredient item', () => {
    expect(isIngredientItem(validIngredient)).toBe(true);
  });

  it('returns false for wrong categoryType', () => {
    expect(isIngredientItem({ ...validIngredient, categoryType: 'Food' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isIngredientItem(null)).toBe(false);
  });
});

describe('isScrollItem', () => {
  const validScroll = {
    formId: '0x222',
    name: 'Scroll of Fireball',
    effects: ['Fire Damage'],
    categoryType: 'Scroll',
  };

  it('returns true for valid scroll item', () => {
    expect(isScrollItem(validScroll)).toBe(true);
  });

  it('returns false for wrong categoryType', () => {
    expect(isScrollItem({ ...validScroll, categoryType: 'Book' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isScrollItem(null)).toBe(false);
  });
});

describe('isBookItem', () => {
  const validBook = {
    formId: '0x333',
    name: 'The Lusty Argonian Maid',
    description: 'A classic tale',
    categoryType: 'Book',
  };

  it('returns true for valid book item', () => {
    expect(isBookItem(validBook)).toBe(true);
  });

  it('returns false when description is missing', () => {
    expect(isBookItem({ formId: '0x333', name: 'The Lusty Argonian Maid', categoryType: 'Book' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isBookItem({ ...validBook, categoryType: 'Scroll' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isBookItem(null)).toBe(false);
  });
});

describe('isKeyItem', () => {
  const validKey = { formId: '0x444', name: 'Whiterun Key', categoryType: 'Key' };

  it('returns true for valid key item', () => {
    expect(isKeyItem(validKey)).toBe(true);
  });

  it('returns false for wrong categoryType', () => {
    expect(isKeyItem({ ...validKey, categoryType: 'Misc' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isKeyItem(null)).toBe(false);
  });
});

describe('isMiscItem', () => {
  const validMisc = { formId: '0x555', name: 'Basket', categoryType: 'Misc' };

  it('returns true for valid misc item', () => {
    expect(isMiscItem(validMisc)).toBe(true);
  });

  it('returns false for wrong categoryType', () => {
    expect(isMiscItem({ ...validMisc, categoryType: 'Key' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isMiscItem(null)).toBe(false);
  });
});

describe('isGem', () => {
  const validGem = {
    formId: '0x666',
    name: 'Grand Soul Gem',
    capacity: 'Grand',
    containedSoul: 'Grand',
    categoryType: 'SoulGem',
  };

  it('returns true for valid gem item', () => {
    expect(isGem(validGem)).toBe(true);
  });

  it('returns false when capacity is missing', () => {
    expect(isGem({ formId: '0x666', name: 'Grand Soul Gem', containedSoul: 'Grand', categoryType: 'SoulGem' })).toBe(false);
  });

  it('returns false when containedSoul is missing', () => {
    expect(isGem({ formId: '0x666', name: 'Grand Soul Gem', capacity: 'Grand', categoryType: 'SoulGem' })).toBe(false);
  });

  it('returns false for wrong categoryType', () => {
    expect(isGem({ ...validGem, categoryType: 'Misc' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isGem(null)).toBe(false);
  });
});

// ============================================================
// Magic type guards
// ============================================================

describe('isMagicCategoriesData', () => {
  it('returns true for valid magic categories', () => {
    expect(isMagicCategoriesData({ categories: ['Destruction', 'Alteration'] }, 'magic.categories')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isMagicCategoriesData({ categories: [] }, 'magic.wrong')).toBe(false);
  });

  it('returns false when categories is missing', () => {
    expect(isMagicCategoriesData({}, 'magic.categories')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isMagicCategoriesData(null, 'magic.categories')).toBe(false);
  });
});

describe('isDestructionData', () => {
  it('returns true for valid id and object data', () => {
    expect(isDestructionData({}, 'magic.destruction')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isDestructionData({}, 'magic.alteration')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isDestructionData(null, 'magic.destruction')).toBe(false);
  });
});

describe('isAlterationData', () => {
  it('returns true for valid id', () => {
    expect(isAlterationData({}, 'magic.alteration')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isAlterationData({}, 'magic.destruction')).toBe(false);
  });
});

describe('isConjurationData', () => {
  it('returns true for valid id', () => {
    expect(isConjurationData({}, 'magic.conjuration')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isConjurationData({}, 'magic.illusion')).toBe(false);
  });
});

describe('isIllusionData', () => {
  it('returns true for valid id', () => {
    expect(isIllusionData({}, 'magic.illusion')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isIllusionData({}, 'magic.restoration')).toBe(false);
  });
});

describe('isRestorationData', () => {
  it('returns true for valid id', () => {
    expect(isRestorationData({}, 'magic.restoration')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isRestorationData({}, 'magic.enchanting')).toBe(false);
  });
});

describe('isEnchantingData', () => {
  it('returns true for valid id', () => {
    expect(isEnchantingData({}, 'magic.enchanting')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isEnchantingData({}, 'magic.destruction')).toBe(false);
  });
});

describe('isShoutsData', () => {
  it('returns true for valid id and object data', () => {
    expect(isShoutsData({}, 'magic.shouts')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isShoutsData({}, 'magic.destruction')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isShoutsData(null, 'magic.shouts')).toBe(false);
  });
});

describe('isShoutItem', () => {
  const validShout = {
    formId: '0x777',
    name: 'Unrelenting Force',
    description: 'Fus Ro Dah',
    words: ['Fus', 'Ro', 'Dah'],
  };

  it('returns true for valid shout item', () => {
    expect(isShoutItem(validShout)).toBe(true);
  });

  it('returns false when words is missing', () => {
    expect(isShoutItem({ formId: '0x777', name: 'Unrelenting Force', description: 'Fus Ro Dah' })).toBe(false);
  });

  it('returns false when description is missing', () => {
    expect(isShoutItem({ formId: '0x777', name: 'Unrelenting Force', words: ['Fus'] })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isShoutItem(null)).toBe(false);
  });
});

describe('isSpellItem', () => {
  const validSpell = {
    formId: '0x888',
    name: 'Fireball',
    cost: 150,
    level: 50,
    effects: ['Fire Damage 40pts'],
  };

  it('returns true for valid spell item', () => {
    expect(isSpellItem(validSpell)).toBe(true);
  });

  it('returns false when cost is missing', () => {
    expect(isSpellItem({ formId: '0x888', name: 'Fireball', level: 50, effects: [] })).toBe(false);
  });

  it('returns false when level is missing', () => {
    expect(isSpellItem({ formId: '0x888', name: 'Fireball', cost: 150, effects: [] })).toBe(false);
  });

  it('returns false when effects is not an array', () => {
    expect(isSpellItem({ formId: '0x888', name: 'Fireball', cost: 150, level: 50, effects: 'Fire' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isSpellItem(null)).toBe(false);
  });
});

// ============================================================
// Hotkeys, Quests, Game Status, Map
// ============================================================

describe('isHotkeyItemsData', () => {
  it('returns true for valid hotkey items data', () => {
    expect(isHotkeyItemsData({ items: [] }, 'hotkeys.items')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isHotkeyItemsData({ items: [] }, 'hotkeys.wrong')).toBe(false);
  });

  it('returns false when items is missing', () => {
    expect(isHotkeyItemsData({}, 'hotkeys.items')).toBe(false);
  });

  it('returns false when items is not an array', () => {
    expect(isHotkeyItemsData({ items: 'not-array' }, 'hotkeys.items')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isHotkeyItemsData(null, 'hotkeys.items')).toBe(false);
  });
});

describe('isQuestsData', () => {
  it('returns true for valid quests data', () => {
    expect(isQuestsData({ quests: [] }, 'quests.questsList')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isQuestsData({ quests: [] }, 'quests.wrong')).toBe(false);
  });

  it('returns false when quests is missing', () => {
    expect(isQuestsData({}, 'quests.questsList')).toBe(false);
  });

  it('returns false when quests is not an array', () => {
    expect(isQuestsData({ quests: 'not-array' }, 'quests.questsList')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isQuestsData(null, 'quests.questsList')).toBe(false);
  });
});

describe('isQuestListSection', () => {
  it('returns true for valid quest list section', () => {
    expect(isQuestListSection({ type: 'section', formId: 'MISC_SECTION' })).toBe(true);
  });

  it('returns false when type is not section', () => {
    expect(isQuestListSection({ type: 'quest', formId: '0x999' })).toBe(false);
  });

  it('returns false when formId is not a string', () => {
    expect(isQuestListSection({ type: 'section', formId: 123 })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isQuestListSection(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isQuestListSection('string')).toBe(false);
  });
});

describe('isQuestJournalEntry', () => {
  const validQuest = {
    questFormId: '0xaaa',
    formId: '0xbbb',
    name: 'Dragon Rising',
    isActive: true,
    isMisc: false,
    steps: ['Kill the dragon', 'Return to Jarl'],
  };

  it('returns true for valid quest journal entry', () => {
    expect(isQuestJournalEntry(validQuest)).toBe(true);
  });

  it('returns false when questFormId is missing', () => {
    const { questFormId: _qfid, ...rest } = validQuest;
    expect(isQuestJournalEntry(rest)).toBe(false);
  });

  it('returns false when isActive is not boolean', () => {
    expect(isQuestJournalEntry({ ...validQuest, isActive: 'yes' })).toBe(false);
  });

  it('returns false when isMisc is not boolean', () => {
    expect(isQuestJournalEntry({ ...validQuest, isMisc: 'no' })).toBe(false);
  });

  it('returns false when steps is not an array', () => {
    expect(isQuestJournalEntry({ ...validQuest, steps: 'step' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isQuestJournalEntry(null)).toBe(false);
  });
});

describe('isGameStatusData', () => {
  it('returns true for valid game status data', () => {
    expect(isGameStatusData({ status: { canAct: true } }, 'game.status')).toBe(true);
  });

  it('returns true when canAct is false', () => {
    expect(isGameStatusData({ status: { canAct: false } }, 'game.status')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isGameStatusData({ status: { canAct: true } }, 'game.wrong')).toBe(false);
  });

  it('returns false when status is missing', () => {
    expect(isGameStatusData({}, 'game.status')).toBe(false);
  });

  it('returns false when status.canAct is missing', () => {
    expect(isGameStatusData({ status: {} }, 'game.status')).toBe(false);
  });

  it('returns false when status.canAct is not boolean', () => {
    expect(isGameStatusData({ status: { canAct: 'yes' } }, 'game.status')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isGameStatusData(null, 'game.status')).toBe(false);
  });
});

describe('isMapHotspotsData', () => {
  it('returns true for valid map hotspots data', () => {
    expect(isMapHotspotsData({ hot: [] }, 'map.hotspots')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isMapHotspotsData({ hot: [] }, 'map.wrong')).toBe(false);
  });

  it('returns false when hot is missing', () => {
    expect(isMapHotspotsData({}, 'map.hotspots')).toBe(false);
  });

  it('returns false when hot is not an array', () => {
    expect(isMapHotspotsData({ hot: 'not-array' }, 'map.hotspots')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isMapHotspotsData(null, 'map.hotspots')).toBe(false);
  });
});

describe('isMapQuestMarkersData', () => {
  it('returns true for valid map quest markers data', () => {
    expect(isMapQuestMarkersData({ marker: [] }, 'map.questMarkers')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isMapQuestMarkersData({ marker: [] }, 'map.wrong')).toBe(false);
  });

  it('returns false when marker is missing', () => {
    expect(isMapQuestMarkersData({}, 'map.questMarkers')).toBe(false);
  });

  it('returns false when marker is not an array', () => {
    expect(isMapQuestMarkersData({ marker: 'not-array' }, 'map.questMarkers')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isMapQuestMarkersData(null, 'map.questMarkers')).toBe(false);
  });
});

describe('isPlayerPositionData', () => {
  it('returns true for valid player position data', () => {
    expect(isPlayerPositionData({ position: { x: 100, y: 200, angle: 45 } }, 'map.player')).toBe(true);
  });

  it('returns false for wrong id', () => {
    expect(isPlayerPositionData({ position: { x: 100, y: 200, angle: 45 } }, 'map.wrong')).toBe(false);
  });

  it('returns false when position is missing', () => {
    expect(isPlayerPositionData({}, 'map.player')).toBe(false);
  });

  it('returns false when position.x is not a number', () => {
    expect(isPlayerPositionData({ position: { x: '100', y: 200, angle: 45 } }, 'map.player')).toBe(false);
  });

  it('returns false when position.y is not a number', () => {
    expect(isPlayerPositionData({ position: { x: 100, y: '200', angle: 45 } }, 'map.player')).toBe(false);
  });

  it('returns false when position.angle is not a number', () => {
    expect(isPlayerPositionData({ position: { x: 100, y: 200, angle: '45' } }, 'map.player')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPlayerPositionData(null, 'map.player')).toBe(false);
  });
});