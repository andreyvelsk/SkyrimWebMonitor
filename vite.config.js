import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { execSync } from 'child_process';

function getAppVersion() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/SkyrimWebMonitor/',
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(getAppVersion()),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/ws': {
          // target must be http://, not ws:// — Vite handles the WS upgrade internally
          target: env.VITE_WS_SERVER_URL,
          ws: true,
          rewriteWsOrigin: true,
          changeOrigin: true,
        },
      },
    },
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        // Precache только манифест/иконки PWA, остальное — строго по сети,
        // чтобы новые деплои подхватывались без ручной очистки кэша.
        includeAssets: [],
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          // Не precache'им HTML/JS/CSS — иначе после деплоя пользователь
          // видит старую версию до повторной перезагрузки.
          globPatterns: [],
          // Не перехватываем навигацию: HTML всегда берётся из сети.
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            // Локальные SVG-иконки
            {
              urlPattern: ({ request, url }) =>
                request.destination === 'image' && url.pathname.endsWith('.svg'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'local-svg-icons',
                cacheableResponse: { statuses: [0, 200] },
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
              },
            },
            // Локальные шрифты
            {
              urlPattern: ({ request, url }) =>
                request.destination === 'font' ||
                /\.(?:woff2?|ttf|otf|eot)$/i.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'local-fonts',
                cacheableResponse: { statuses: [0, 200] },
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 365 * 24 * 60 * 60,
                },
              },
            },
            // Google Fonts CSS
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 365 * 24 * 60 * 60,
                },
              },
            },
            // Google Fonts файлы
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                cacheableResponse: { statuses: [0, 200] },
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 365 * 24 * 60 * 60,
                },
              },
            },
          ],
        },
        manifest: {
          name: 'SkyrimWebMonitor',
          short_name: 'Skyrim Monitor',
          description: 'Web Monitor for Skyrim',
          theme_color: '#0d0d0d',
          background_color: '#0d0d0d',
          display: 'standalone',
          scope: '/SkyrimWebMonitor/',
          start_url: '/SkyrimWebMonitor/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
  };
});

