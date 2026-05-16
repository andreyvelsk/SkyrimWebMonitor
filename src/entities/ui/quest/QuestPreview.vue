<template>
  <quest-steps-preview :steps="previewSteps" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QuestJournalEntry } from '@/stores/quests/types';
import QuestStepsPreview from './QuestStepsPreview.vue';

const props = defineProps<{
  quest: QuestJournalEntry;
}>();

const previewSteps = computed(() => {
  return [...props.quest.steps]
    .sort((a, b) => b.index - a.index)
    .map((step) => ({
      id: String(step.instanceId),
      text: step.text,
      indicatorCompleted: step.completed,
      indicatorFailed: step.failed,
    }));
});
</script>
