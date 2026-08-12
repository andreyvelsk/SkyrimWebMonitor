export interface QuestStep {
  index: number;
  text: string;
  textRaw: string;
  completed: boolean;
  failed: boolean;
  state: string;
  stateRaw: number;
  instanceId: number;
}

export interface QuestJournalEntry {
  type: 'quest';
  formId: string;
  questFormId: string;
  questEditorId: string;
  name: string;
  nameRaw: string;
  description: string;
  descriptionRaw: string;
  descriptionStage: number;
  questType: string;
  isMisc: boolean;
  isActive: boolean;
  isRunning: boolean;
  isCompleted: boolean;
  currentStage: number;
  currentInstanceId: number;
  steps: QuestStep[];
}

export interface QuestListSection {
  type: 'section';
  formId: string;
  section: 'misc';
}

export type QuestListEntry = QuestJournalEntry | QuestListSection;

export interface QuestsState {
  quests?: QuestJournalEntry[] | null;
}
