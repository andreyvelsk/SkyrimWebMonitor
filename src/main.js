import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@/shared/lib/styles/skyrim-theme.scss';
import './style.css';
import App from './app/App.vue';
import { registerSW } from 'virtual:pwa-register';
import i18n from './i18n';

// Push a guard entry immediately so the Android back gesture is intercepted
// even before Vue mounts (prevents instant app close on first back swipe).
if (!history.state?.pwaBackGuard) {
  history.pushState({ pwaBackGuard: true }, '');
}

// Register service worker for PWA only in production (avoid dev caching).
// With autoUpdate, vite-plugin-pwa reloads the page automatically once the
// new SW takes control. The block below only forces an update check on every
// app launch / tab focus — without it a mobile PWA may keep using the stale
// SW for days because the browser rarely re-checks on its own.
if (import.meta.env.PROD) {
  const intervalMs = 60 * 60 * 1000; // periodic re-check while app is open
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const update = () => {
        registration.update().catch(() => {
          /* offline / network error — ignore */
        });
      };

      // Check right after registration.
      update();

      // Periodic check while the tab/PWA stays open.
      setInterval(update, intervalMs);

      // And — most importantly — whenever the user comes back to the
      // app (PWA resumed from background, tab regains focus, bfcache).
      const onVisible = () => {
        if (document.visibilityState === 'visible') update();
      };
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('focus', update);
      window.addEventListener('pageshow', update);
    },
  });
}

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.mount('#app');
