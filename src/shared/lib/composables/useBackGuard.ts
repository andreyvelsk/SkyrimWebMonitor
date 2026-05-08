import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
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
  const isNativeCapacitor = Capacitor.isNativePlatform();

  const TOAST_TIMEOUT_MS = 2000;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  let nativeBackListener: PluginListenerHandle | null = null;

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
    if (isNativeCapacitor) {
      void CapacitorApp.exitApp();
      return;
    }

    if (isStandalone()) {
      // Chromium installed PWA closes; iOS PWA ignores (platform limit).
      window.close();
      return;
    }
    // Regular browser tab: leave the SPA through real history.
    history.back();
  }

  function armExitGuard() {
    if (!isNativeCapacitor) {
      // Keep popstate firing on each system back in web/PWA mode.
      pushDummyState();
    }

    clearToast();
    showToast.value = true;
    toastTimer = setTimeout(() => {
      showToast.value = false;
      toastTimer = null;
    }, TOAST_TIMEOUT_MS);
  }

  function handleBackAttempt() {
    if (showToast.value) {
      // Second back press within the timeout window — exit.
      closeApp();
      return;
    }

    armExitGuard();
  }

  onMounted(() => {
    if (isNativeCapacitor) {
      void CapacitorApp.addListener('backButton', handleBackAttempt).then(
        (listener) => {
          nativeBackListener = listener;
        }
      );
      return;
    }

    pushDummyState();
    window.addEventListener('popstate', handleBackAttempt);
  });

  onUnmounted(() => {
    if (!isNativeCapacitor) {
      window.removeEventListener('popstate', handleBackAttempt);
    }

    void nativeBackListener?.remove();
    if (toastTimer !== null) clearTimeout(toastTimer);
  });

  return { showToast };
}

