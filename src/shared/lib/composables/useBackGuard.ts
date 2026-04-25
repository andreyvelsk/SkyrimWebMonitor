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

  function isStandalone(): boolean {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: fullscreen)').matches ||
      window.matchMedia?.('(display-mode: minimal-ui)').matches ||
      // iOS Safari PWA
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  function closeApp() {
    if (isStandalone()) {
      // In an installed PWA: try to close the window. Chromium-based
      // browsers allow window.close() for installed apps. iOS Safari and
      // some Android contexts ignore it — in that case we fall back to
      // a blank page so the user clearly sees they can close manually.
      try {
        window.close();
      } catch {
        /* ignore */
      }
      // If after a tick the window is still open, navigate to about:blank
      // as a visible fallback. Use location.replace so the user can't
      // navigate "back" into the app and re-trigger the guard loop.
      setTimeout(() => {
        if (!window.closed) {
          location.replace('about:blank');
        }
      }, 50);
      return;
    }

    // Regular browser tab: window.close() is blocked by the browser
    // for tabs the script didn't open. The most useful fallback is to
    // leave the SPA via the real previous history entry.
    history.back();
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
