<template>
  <div
    class="quest-steps-preview"
    :class="{
      'quest-steps-preview--interactive': interactive,
      'quest-steps-preview--scrollable': scrollable,
    }"
  >
    <ul
      v-if="steps.length"
      class="quest-steps-preview__steps"
    >
      <li
        v-for="step in steps"
        :key="step.id"
        class="quest-steps-preview__step"
        :class="{
          'quest-steps-preview__step--active': activeStepItem === step.id,
        }"
        @click="selectStepItem(step.id)"
      >
        <div class="quest-steps-preview__step-indicator">
          <quest-step-indicator
            v-if="step.showIndicator !== false"
            :completed="step.indicatorCompleted"
            :failed="step.indicatorFailed"
          />
        </div>

        <span class="quest-steps-preview__step-text">{{ step.text }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import QuestStepIndicator from './QuestStepIndicator.vue';

export interface QuestStepsPreviewItem {
  id: string;
  text: string;
  indicatorCompleted: boolean;
  indicatorFailed: boolean;
  showIndicator?: boolean;
}

const props = withDefaults(defineProps<{
  steps: QuestStepsPreviewItem[];
  interactive?: boolean;
  scrollable?: boolean;
}>(), {
  interactive: false,
  scrollable: true,
});

const emit = defineEmits<{
  toggleActive: [formId: string];
}>();

const activeStepItem = ref<string | null>(null);

watch(() => props.steps, (steps) => {
  if (!activeStepItem.value) return;

  const stillExists = steps.some((step) => step.id === activeStepItem.value);
  if (!stillExists) {
    activeStepItem.value = null;
  }
});

function selectStepItem(formId: string) {
  if (!props.interactive) return;

  if (activeStepItem.value === formId) {
    emit('toggleActive', formId);
    return;
  }

  activeStepItem.value = formId;
}
</script>

<style scoped lang="scss">
.quest-steps-preview {
  --quest-steps-preview-step-text-font-size: var(--font-size-base);
  --quest-steps-preview-step-offset-font-size: var(--font-size-sm);
  --quest-steps-preview-step-line-height: 1.4;
  --quest-steps-preview-step-indicator-size: 6px;

  padding: var(--spacing-md);
}

.quest-steps-preview--scrollable {
  height: 100%;
  overflow-y: auto;
}

.quest-steps-preview__steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quest-steps-preview__step {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding-top: 2px;
}

.quest-steps-preview--interactive .quest-steps-preview__step {
  cursor: pointer;
}

.quest-steps-preview__step-indicator {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: var(--quest-steps-preview-step-indicator-size);
  margin-top: calc(
    (
      var(--quest-steps-preview-step-offset-font-size) *
      var(--quest-steps-preview-step-line-height) -
      var(--quest-steps-preview-step-indicator-size)
    ) / 2
  );
}

.quest-steps-preview__step-text {
  font-size: var(--quest-steps-preview-step-text-font-size);
  line-height: var(--quest-steps-preview-step-line-height);
  color: var(--skyrim-text-secondary);
  transition: color var(--transition-fast);
}

.quest-steps-preview__step--active .quest-steps-preview__step-text {
  color: var(--skyrim-text-accent);
}
</style>
