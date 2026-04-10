import { createApp } from 'vue';
import { createPinia } from 'pinia';
import '@/shared/lib/styles/skyrim-theme.scss';
import './style.css';
import App from './app/App.vue';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
registerSW();

const app = createApp(App);

app.use(createPinia());
app.mount('#app');
