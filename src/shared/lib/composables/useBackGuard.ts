import { onMounted, onUnmounted, ref } from 'vue';

/**
 * Android-style "press back again to exit" guard.
 *
 * On the first system back gesture/button we show a transient hint and
 * arm a 2-second window. If the user presses back again inside that
 * window the app is closed; otherwise the hint disappears and the
 * counter resets.
 *
 * Closing behavior is platform-limited:
 *   • Installed PWA on Chromium (Android/desktop) — `window.close()`
 *     closes the standalone window, just like a native back-out.
 *   • Installed PWA on iOS Safari — WebKit has no API to close a
 *     standalone window, so the toast is shown but the second press
 *     is a no-op. This is a platform limitation.
 *   • Regular browser tab — `window.close()` is blocked, so we leave
 *     the SPA via `history.back()`.
 *
 * Returns a `showToast` ref to be bound to a toast component in the
 * application root.
 */
export function useBackGuard() {
  const showToast = ref(false);

  const TOAST_TIMEOUT_MS = 2000;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

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

  function clearToast() {
    if (toastTimer !== null) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    showToast.value = false;
  }

  function closeApp() {
    clearToast();
    if (isStandalone()) {
      // Chromium installed PWA closes; iOS PWA ignores (platform limit).
      window.close();
      return;
    }
    // Regular browser tab: leave the SPA through real history.
    history.back();
  }

  function onPopState() {
    if (showToast.value) {
      // Second back press within the timeout window — exit.
      closeApp();
      return;
    }

    // First back press: re-arm dummy state so subsequent presses keep
    // firing popstate, show the hint and start the confirmation window.
    pushDummyState();
    showToast.value = true;
    toastTimer = setTimeout(() => {
      showToast.value = false;
      toastTimer = null;
    }, TOAST_TIMEOUT_MS);
  }

  onMounted(() => {
    pushDummyState();
    window.addEventListener('popstate', onPopState);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState);
    if (toastTimer !== null) clearTimeout(toastTimer);
  });

  return { showToast };
}

