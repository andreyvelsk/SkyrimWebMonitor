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

// Register service worker for PWA
// Register service worker for PWA only in production (avoid dev caching)
if (import.meta.env.PROD) {
    registerSW();
}

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.mount('#app');
