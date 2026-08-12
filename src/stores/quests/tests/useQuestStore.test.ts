import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useQuestStore } from '@/stores/quests/useQuestStore';
import type {
  QuestJournalEntry,
  QuestListSection,
} from '@/stores/quests/lib/types';

// =============================================================
// useQuestStore tests
// =============================================================

function makeQuest(overrides: Partial<QuestJournalEntry> = {}): QuestJournalEntry {
  return {
    type: 'quest',
    formId: '0xQuest1',
    questFormId: '0xQuest1',
    questEditorId: 'MQ101',
    name: 'Main Quest',
    nameRaw: 'Main Quest',
    description: 'A quest',
    descriptionRaw: 'A quest',
    descriptionStage: 0,
    questType: 'Main',
    isMisc: false,
    isActive: true,
    isRunning: true,
    isCompleted: false,
    currentStage: 0,
    currentInstanceId: 0,
    steps: [],
    ...overrides,
  };
}

function isQuestSection(entry: { type: string }): entry is QuestListSection {
  return entry.type === 'section';
}

function isQuestEntry(entry: { type: string }): entry is QuestJournalEntry {
  return entry.type === 'quest';
}

describe('useQuestStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('quests is empty array', () => {
      const store = useQuestStore();
      expect(store.quests).toEqual([]);
    });

    it('questsList is empty', () => {
      const store = useQuestStore();
      expect(store.questsList).toEqual([]);
    });
  });

  describe('setQuests', () => {
    it('stores quests with type=quest and formId from questFormId', () => {
      const store = useQuestStore();
      const quest = makeQuest();
      store.setQuests({ quests: [quest] });
      expect(store.quests).toHaveLength(1);
      expect(store.quests[0].type).toBe('quest');
      expect(store.quests[0].formId).toBe('0xQuest1');
    });

    it('handles undefined quests', () => {
      const store = useQuestStore();
      store.setQuests({});
      expect(store.quests).toEqual([]);
    });

    it('handles null quests', () => {
      const store = useQuestStore();
      store.setQuests({ quests: null });
      expect(store.quests).toEqual([]);
    });
  });

  describe('miscQuests', () => {
    it('filters misc quests', () => {
      const store = useQuestStore();
      const active = makeQuest({ formId: '0x1', isMisc: false, name: 'Active' });
      const misc = makeQuest({ formId: '0x3', isMisc: true, name: 'Misc' });
      store.setQuests({ quests: [active, misc] });
      const result = store.miscQuests;
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Misc');
    });
  });

  describe('questsList', () => {
    it('orders: active → MISC_SECTION → inactive', () => {
      const store = useQuestStore();
      const active = makeQuest({ formId: '0x1', isMisc: false, isCompleted: false, name: 'Active' });
      const misc = makeQuest({ formId: '0x3', isMisc: true, isCompleted: false, name: 'Misc' });
      const done = makeQuest({ formId: '0x2', isMisc: false, isCompleted: true, name: 'Done' });
      store.setQuests({ quests: [active, misc, done] });
      const list = store.questsList;
      // questsList = [...activeNonMisc, MISC_SECTION, ...inactiveNonMisc]
      // misc quests are represented by MISC_SECTION divider, not included individually
      expect(list).toHaveLength(3);
      // First: active non-misc
      expect(list[0].type).toBe('quest');
      if (isQuestEntry(list[0])) {
        expect(list[0].name).toBe('Active');
      }
      // Second: misc section divider
      expect(list[1].type).toBe('section');
      if (isQuestSection(list[1])) {
        expect(list[1].section).toBe('misc');
      }
      // Third: inactive non-misc
      expect(list[2].type).toBe('quest');
      if (isQuestEntry(list[2])) {
        expect(list[2].name).toBe('Done');
      }
    });

    it('does not include MISC_SECTION when no misc quests', () => {
      const store = useQuestStore();
      const active = makeQuest({ formId: '0x1', isMisc: false, isCompleted: false, name: 'Active' });
      const done = makeQuest({ formId: '0x2', isMisc: false, isCompleted: true, name: 'Done' });
      store.setQuests({ quests: [active, done] });
      const list = store.questsList;
      expect(list).toHaveLength(2);
      expect(list[0].type).toBe('quest');
      expect(list[1].type).toBe('quest');
    });
  });
});
