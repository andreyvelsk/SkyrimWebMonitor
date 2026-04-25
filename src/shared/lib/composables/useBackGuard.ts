import { onMounted, onUnmounted } from 'vue';
import { ExitConfirmModal } from '@/shared/ui';
import { useModal } from './useModal';

export function useBackGuard() {
  const { openModal, closeModal, isOpen } = useModal();

  function pushDummyState() {
    history.pushState({ pwaBackGuard: true }, '');
  }

  function onPopState() {
    if (isOpen.value) {
      closeModal();
      pushDummyState();
      return;
    }

    openModal({
      component: ExitConfirmModal,
      on: {
        confirm: () => {
          history.back();
        },
        close: () => {
          pushDummyState();
        },
      },
    });
  }

  onMounted(() => {
    pushDummyState();
    window.addEventListener('popstate', onPopState);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState);
  });
}
