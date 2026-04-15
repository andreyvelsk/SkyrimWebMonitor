<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="modal-backdrop" @click.self="closeModal">
        <Transition name="modal-panel">
          <div v-if="isOpen" class="modal-panel">
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
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useModal } from '@/shared/lib/composables/useModal';

const { isOpen, modalComponent, modalProps, modalHandlers, closeModal } =
  useModal();
</script>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 75%);
  backdrop-filter: blur(2px);
}

.modal-panel {
  position: relative;
  background-color: var(--skyrim-bg-medium);
  border: 1px solid var(--skyrim-border-dark);
  padding: var(--spacing-sm);
  min-width: 280px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow:
    var(--shadow-strong),
    inset 0 0 60px rgb(0 0 0 / 30%);
}

.modal-body {
  color: var(--skyrim-text-primary);
  font-family: var(--font-body);
}

/* Backdrop transition */
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
