<template>
  <skyrim-backdrop
    :visible="isOpen"
    role="dialog"
    aria-modal
    transition-name="modal-backdrop"
    @self-click="closeModal"
  >
    <Transition name="modal-panel">
      <div
        v-if="isOpen"
        class="modal-panel"
      >
        <div class="modal-body">
          <component
            :is="modalComponent"
            v-if="modalComponent"
            v-bind="modalProps"
            v-on="modalHandlers"
          />
        </div>
      </div>
    </Transition>
  </skyrim-backdrop>
</template>

<script setup lang="ts">
import { useModal } from '@/shared/lib/composables/useModal';
import SkyrimBackdrop from './SkyrimBackdrop.vue';

const { isOpen, modalComponent, modalProps, modalHandlers, closeModal } =
  useModal();
</script>

<style scoped lang="scss">
/*
 * Layout & frame styles come from the design system:
 *   .modal-panel, .modal-body (components/modal.scss)
 * The full-viewport overlay is provided by <SkyrimBackdrop>.
 * Only the transitions are component-specific and live here.
 */

/* Backdrop transition (overrides default skyrim-backdrop fade timing). */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.25s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

/* Panel transition */
.modal-panel-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.modal-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.modal-panel-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.97);
}

.modal-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
