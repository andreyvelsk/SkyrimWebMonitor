import { shallowRef, ref, type Component } from 'vue';

export interface ModalOptions {
  component: Component;
  /** props of child component */
  props?: Record<string, unknown>;
  /** event handlers of child component */
  on?: Record<string, (...args: any[]) => any>;
  /** callback when modal is closed */
  onClose?: () => void;
  /**
   * Ignore click events for a short time after opening.
   * Helps block delayed synthesized "ghost click" on mobile WebViews.
   */
  ghostClickGuardMs?: number;
}

const isOpen = ref(false);
const modalComponent = shallowRef<Component | null>(null);
const modalProps = ref<Record<string, unknown>>({});
const modalHandlers = ref<Record<string, (...args: any[]) => any>>({});
const openedAtMs = ref(0);
const ghostClickGuardMs = ref(0);
let onCloseCallback: (() => void) | null = null;

function openModal(options: ModalOptions) {
  modalComponent.value = options.component;
  modalProps.value = options.props ?? {};
  modalHandlers.value = options.on ?? {};
  openedAtMs.value = performance.now();
  ghostClickGuardMs.value = Math.max(0, options.ghostClickGuardMs ?? 0);
  isOpen.value = true;
  onCloseCallback = options.onClose ?? null;
}

function closeModal() {
  isOpen.value = false;
  ghostClickGuardMs.value = 0;
  if (onCloseCallback && typeof onCloseCallback === 'function') {
    onCloseCallback();
    onCloseCallback = null;
  }
  setTimeout(() => {
    modalComponent.value = null;
    modalProps.value = {};
    modalHandlers.value = {};
  }, 300);
}

export function useModal() {
  return {
    isOpen,
    modalComponent,
    modalProps,
    modalHandlers,
    openedAtMs,
    ghostClickGuardMs,
    openModal,
    closeModal,
  };
}
