import { onMounted, onUnmounted, watch } from 'vue';
import { ExitConfirmModal } from '@/shared/ui';
import { useModal } from './useModal';

/**
 * Intercepts the system "back" gesture / button and asks the user to
 * confirm exiting the app.
 *
 * Closing the app from JS is platform-limited:
 *   • Installed PWA on Chromium (Android/desktop) — `window.close()` works.
 *   • Installed PWA on iOS Safari — there is no web API to close the
 *     standalone window. The modal will close and the user has to use
 *     a system gesture. This is a WebKit limitation, not a bug.
 *   • Regular browser tab — `window.close()` is blocked by the spec, so
 *     we fall back to leaving the SPA via `history.back()`.
 */
export function useBackGuard() {
  const { openModal, closeModal, isOpen } = useModal();

  function pushDummyState() {
    if (history.state?.pwaBackGuard !== true) {
      history.pushState({ pwaBackGuard: true }, '');
    }
  }

  function isStandalone(): boolean {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: fullscreen)').matches ||
      window.matchMedia?.('(display-mode: minimal-ui)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  function closeApp() {
    if (isStandalone()) {
      // The only legitimate way to close an installed PWA from JS.
      // Works in Chromium-based browsers. On iOS Safari this is a no-op
      // and there is no alternative — the modal simply closes.
      window.close();
      return;
    }
    // Regular browser tab: leave the SPA via the previous history entry.
    history.back();
  }

  function onPopState() {
    if (isOpen.value) {
      // Back pressed while modal is already open — dismiss it.
      closeModal();
      pushDummyState();
      return;
    }

    // Re-arm immediately so the next back press is also intercepted
    // (e.g. if user keeps pressing back instead of using the modal).
    pushDummyState();

    openModal({
      component: ExitConfirmModal,
      on: {
        confirm: () => {
          closeModal();
          closeApp();
        },
        close: () => {
          closeModal();
        },
      },
    });
  }

  // Safety net: if the modal closes through some other path
  // (ESC, backdrop) keep the guard armed.
  watch(isOpen, (val) => {
    if (!val) pushDummyState();
  });

  onMounted(() => {
    pushDummyState();
    window.addEventListener('popstate', onPopState);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState);
  });
}

