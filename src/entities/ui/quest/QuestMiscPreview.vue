<template>
  <quest-steps-preview
    :steps="miscStepItems"
    interactive
    @toggle-active="emit('toggleActive', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QuestJournalEntry, QuestStep } from '@/stores/quests/types';
import QuestStepsPreview from './QuestStepsPreview.vue';

const props = defineProps<{
  quests: QuestJournalEntry[];
}>();

const emit = defineEmits<{
  toggleActive: [formId: string];
}>();

function getFirstStep(steps: QuestStep[]): QuestStep | null {
  if (!steps.length) return null;

  return steps.reduce((first, current) => {
    return current.index < first.index ? current : first;
  });
}

const miscStepItems = computed(() => {
  return props.quests
    .map((quest) => {
      const firstStep = getFirstStep(quest.steps);
      return {
        id: quest.formId,
        text: firstStep?.text || quest.name,
        indicatorCompleted: quest.isActive,
        indicatorFailed: false,
      };
    })
    .filter((item) => item.text.trim().length > 0);
});
</script>
