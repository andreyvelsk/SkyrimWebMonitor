<template>
  <Teleport to="body">
    <Transition
      name="modal-backdrop"
      appear
    >
      <div
        v-if="isOpen"
        class="skyrim-backdrop skyrim-backdrop--fixed skyrim-backdrop--overlay skyrim-backdrop--blocking"
        role="dialog"
        aria-modal="true"
        @click.self="onBackdropClick"
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
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useModal } from '@/shared/lib/composables/useModal';

const { isOpen, modalComponent, modalProps, modalHandlers, closeModal } =
  useModal();

// Capacitor WebView can emit a delayed synthesized click after touchend.
// If a modal opens from that touch, the ghost click may instantly close it.
const BACKDROP_GHOST_CLICK_GUARD_MS = 350;
const openedAtMs = ref(0);

watch(isOpen, (open) => {
  if (open) {
    openedAtMs.value = performance.now();
  }
});

function onBackdropClick(): void {
  const elapsed = performance.now() - openedAtMs.value;
  if (elapsed < BACKDROP_GHOST_CLICK_GUARD_MS) {
    return;
  }
  closeModal();
}
</script>

<style scoped lang="scss">
/*
 * Layout & frame styles come from the design system:
 *   .modal-panel, .modal-body (components/modal.scss)
 * The full-viewport overlay is provided by shared .skyrim-backdrop classes.
 * Only the transitions are component-specific and live here.
 */

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
