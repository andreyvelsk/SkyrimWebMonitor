import { onMounted, onUnmounted, watch } from 'vue';
import { ExitConfirmModal } from '@/shared/ui';
import { useModal } from './useModal';

export function useBackGuard() {
  const { openModal, closeModal, isOpen } = useModal();

  // Flag to skip the popstate that history.back() fires after user confirms exit
  let isConfirming = false;

  function pushDummyState() {
    history.pushState({ pwaBackGuard: true }, '');
  }

  function onPopState() {
    // Ignore the popstate triggered by history.back() in the confirm handler
    if (isConfirming) {
      isConfirming = false;
      return;
    }

    if (isOpen.value) {
      // Back pressed while modal is already open — treat as dismiss
      closeModal();
      return;
    }

    openModal({
      component: ExitConfirmModal,
      on: {
        confirm: () => {
          isConfirming = true;
          closeModal();
          history.back();
        },
        close: () => {
          closeModal();
        },
      },
    });
  }

  // Re-arm the guard whenever the modal closes (No button, backdrop, or back press).
  // When confirming exit, isConfirming is true so we skip the re-push.
  watch(isOpen, (val) => {
    if (!val && !isConfirming) {
      pushDummyState();
    }
  });

  onMounted(() => {
    window.addEventListener('popstate', onPopState);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState);
  });
}
