import { shallowRef, ref, type Component } from 'vue';

export interface ModalOptions {
  component: Component;
  /** props of child component */
  props?: Record<string, unknown>;
  /** event handlers of child component */
  on?: Record<string, (...args: any[]) => any>;
  /** callback when modal is closed */
  onClose?: () => void;
}

const isOpen = ref(false);
const modalComponent = shallowRef<Component | null>(null);
const modalProps = ref<Record<string, unknown>>({});
const modalHandlers = ref<Record<string, (...args: any[]) => any>>({});
let onCloseCallback: (() => void) | null = null;

function openModal(options: ModalOptions) {
  modalComponent.value = options.component;
  modalProps.value = options.props ?? {};
  modalHandlers.value = options.on ?? {};
  isOpen.value = true;
  onCloseCallback = options.onClose ?? null;
}

function closeModal() {
  isOpen.value = false;
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
  return { isOpen, modalComponent, modalProps, modalHandlers, openModal, closeModal };
}
