import { shallowRef, ref, type Component } from 'vue';
import type { ModalOptions } from '@/shared/lib/types';

const isOpen = ref(false);
const modalComponent = shallowRef<Component | null>(null);
const modalProps = ref<Record<string, unknown>>({});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modalHandlers = ref<Record<string, (...args: any[]) => unknown>>({});
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
