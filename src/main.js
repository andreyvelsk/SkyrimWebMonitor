import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/skyrim-theme.css';
import App from './App.vue';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
registerSW();

const app = createApp(App);

app.use(createPinia());
app.mount('#app');
