import { onMounted, onUnmounted, watch } from 'vue';
import { ExitConfirmModal } from '@/shared/ui';
import { useModal } from './useModal';

export function useBackGuard() {
  const { openModal, closeModal, isOpen } = useModal();

  // Set to true once the user confirmed exit, so popstate after closeApp() is ignored
  let isConfirming = false;

  function pushDummyState() {
    history.pushState({ pwaBackGuard: true }, '');
  }

  function closeApp() {
    // In PWA standalone mode window.close() actually closes the app window.
    // In a regular browser tab the call is usually blocked by the browser,
    // so as a fallback we navigate back out of the SPA.
    try {
      window.close();
    } catch {
      // ignore — fall through to history.back()
    }
    // If window.close() didn't work (browser tab), leave the SPA via history.
    setTimeout(() => {
      history.back();
    }, 0);
  }

  function onPopState() {
    if (isConfirming) {
      // popstate fired due to our own history.back() inside closeApp()
      return;
    }

    if (isOpen.value) {
      // Back pressed while modal is already open — treat as dismiss.
      // Re-arm dummy state so the next back press is also intercepted.
      closeModal();
      pushDummyState();
      return;
    }

    // Re-arm the dummy state immediately so that any further back presses
    // keep firing popstate instead of leaving the app.
    pushDummyState();

    openModal({
      component: ExitConfirmModal,
      on: {
        confirm: () => {
          isConfirming = true;
          closeModal();
          closeApp();
        },
        close: () => {
          closeModal();
        },
      },
    });
  }

  // Safety net: if isOpen flips to false through some other path (e.g. ESC,
  // backdrop click) make sure the guard is still armed.
  watch(isOpen, (val) => {
    if (!val && !isConfirming) {
      // Only push if our dummy state isn't already on top.
      if (history.state?.pwaBackGuard !== true) {
        pushDummyState();
      }
    }
  });

  onMounted(() => {
    // Arm the guard on first mount so the very first back press is intercepted.
    if (history.state?.pwaBackGuard !== true) {
      pushDummyState();
    }
    window.addEventListener('popstate', onPopState);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState);
  });
}
