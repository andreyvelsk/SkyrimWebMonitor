import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@/shared/lib/styles/skyrim-theme.scss';
import './style.css';
import App from './app/App.vue';
import { registerSW } from 'virtual:pwa-register';
import i18n from './i18n';

// Register service worker for PWA
// Register service worker for PWA only in production (avoid dev caching)
if (import.meta.env.PROD) {
    registerSW();
}

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.mount('#app');
