<template>
  <div class="quest-preview">
    <p
      v-if="quest.description"
      class="quest-preview__description"
    >
      {{ quest.description }}
    </p>

    <quest-steps-preview
      :steps="previewSteps"
      :scrollable="false"
    />
  </div>
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

<style scoped lang="scss">
.quest-preview {
  height: 100%;
  overflow-y: auto;
}

.quest-preview__description {
  margin: 0;
  padding: var(--spacing-md) var(--spacing-md) 0;
  color: var(--skyrim-text-primary);
  font-size: var(--font-size-sm);
}
</style>
