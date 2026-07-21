<template>
  <div class="attribution-credits">
    <button
      class="attribution-credits__link"
      type="button"
      @click="showCredits"
    >
      {{ $t('shared.ui.connectionStatus.credits') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useModal } from '@/shared/lib/composables/useModal';
import AttributionModalContent from './AttributionModalContent.vue';

const { openModal } = useModal();

function showCredits(): void {
  openModal({
    component: AttributionModalContent,
  });
}
</script>

<style scoped lang="scss">
.attribution-credits {
  align-self: flex-start;

  &__link {
    display: inline;
    padding: 0;
    border: none;
    background: none;
    font-family: inherit;
    font-size: var(--font-size-base, 0.75rem);
    color: var(--skyrim-text-dim);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover,
    &:focus-visible {
      color: var(--skyrim-text-secondary);
    }
  }
}
</style>
