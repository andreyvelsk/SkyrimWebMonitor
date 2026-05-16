import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  QuestsState,
  QuestJournalEntry,
  QuestListEntry,
  QuestListSection,
} from './types';

const MISC_SECTION: QuestListSection = {
  type: 'section',
  formId: '__quests-section-misc__',
  section: 'misc',
};

export const useQuestStore = defineStore('quests', () => {
  const quests = ref<QuestJournalEntry[]>([]);

  const activeNonMisc = computed(() => {
    return quests.value.filter((quest) => !quest.isMisc && !quest.isCompleted);
  });

  const miscQuests = computed(() => {
    return quests.value.filter((quest) => quest.isMisc);
  });

  const inactiveNonMisc = computed(() => {
    return quests.value.filter((quest) => !quest.isMisc && quest.isCompleted);
  });

  const questsList = computed<QuestListEntry[]>(() => {
    const list: QuestListEntry[] = [];

    list.push(...activeNonMisc.value);

    if (miscQuests.value.length > 0) {
      list.push(MISC_SECTION);
    }

    list.push(...inactiveNonMisc.value);

    return list;
  });

  const setQuests = (newQuests: QuestsState) => {
    const next = (newQuests.quests ?? []).map((quest) => ({
      ...quest,
      type: 'quest' as const,
      formId: quest.questFormId,
    }));

    quests.value = next;
  };

  return {
    quests,
    miscQuests,
    questsList,
    setQuests,
  };
});
