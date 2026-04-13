import { shallowRef, ref, type Component } from 'vue';

export interface ModalOptions {
  component: Component;
  props?: Record<string, unknown>;
  on?: Record<string, (...args: any[]) => any>;
}

const isOpen = ref(false);
const modalComponent = shallowRef<Component | null>(null);
const modalProps = ref<Record<string, unknown>>({});
const modalHandlers = ref<Record<string, (...args: any[]) => any>>({});

function openModal(options: ModalOptions) {
  modalComponent.value = options.component;
  modalProps.value = options.props ?? {};
  modalHandlers.value = options.on ?? {};
  isOpen.value = true;
}

function closeModal() {
  isOpen.value = false;
  setTimeout(() => {
    modalComponent.value = null;
    modalProps.value = {};
    modalHandlers.value = {};
  }, 300);
}

export function useModal() {
  return { isOpen, modalComponent, modalProps, modalHandlers, openModal, closeModal };
}
