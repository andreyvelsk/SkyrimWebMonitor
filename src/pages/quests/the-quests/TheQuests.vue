<template>
  <inventory-list
    v-model="activeItem"
    class="quests-list"
    :items="questsList"
    :empty-message="$t('pages.quests.questsList.waitingForData')"
    :actions="[]"
    @item-double-click="toggleQuestActive"
  >
    <template #default="{ item, active, onSelect }">
      <quest-item
        v-if="isQuestListSection(item)"
        :name="$t(`pages.quests.questsList.sections.${item.section}`)"
        :active="active"
        @click="onSelect"
      />

      <quest-item
        v-else-if="isQuestJournalEntry(item)"
        :name="item.name || $t('pages.quests.questsList.unknown')"
        :active="active"
        :disabled="item.isCompleted"
        :is-quest-active="item.isActive"
        @click="onSelect"
      />
    </template>

    <template #preview>
      <quest-preview
        v-if="activeQuest"
        :quest="activeQuest"
      />

      <quest-misc-preview
        v-else-if="isMiscSectionSelected"
        :quests="miscQuests"
        @toggle-active="toggleQuestActive"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { InventoryList } from '@/features/ui';
import { QuestItem, QuestPreview, QuestMiscPreview } from '@/entities/ui';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useQuestStore } from '@/stores/quests/useQuestStore';
import {
  isQuestJournalEntry,
  isQuestListSection,
} from '@/stores/adapters/typeGuards';

const MISC_SECTION_FORM_ID = '__quests-section-misc__';

const questStore = useQuestStore();
const wsStore = useWebSocketStore();
const { questsList, miscQuests } = storeToRefs(questStore);

const activeItem = ref<string | null>(null);

const isMiscSectionSelected = computed(() => {
  return activeItem.value === MISC_SECTION_FORM_ID;
});

const activeQuest = computed(() => {
  if (!activeItem.value) return null;
  const entry = questsList.value.find(
    (item) => isQuestJournalEntry(item) && item.formId === activeItem.value,
  );
  return isQuestJournalEntry(entry) ? entry : null;
});

watch(questsList, (next) => {
  if (!next.length) {
    activeItem.value = null;
    return;
  }

  if (!activeItem.value) {
    activeItem.value = next[0]?.formId ?? null;
    return;
  }

  const stillExists = next.some((item) => item.formId === activeItem.value);

  if (!stillExists) {
    activeItem.value = next[0]?.formId ?? null;
  }
}, { immediate: true });

function toggleQuestActive(formId: string) {
  if (formId === MISC_SECTION_FORM_ID) {
    return;
  }

  const quest = questsList.value.find((item) => {
    return isQuestJournalEntry(item) && item.formId === formId;
  }) || miscQuests.value.find((item) => item.formId === formId);

  if (!isQuestJournalEntry(quest)) {
    return;
  }

  wsStore.sendCommand({
    command: 'quest_set_active',
    formId,
    active: !quest.isActive,
  });
}
</script>

<style scoped lang="scss">
.quests-list {
  --inventory-list-wrapper-width: 50%;
}
</style>
