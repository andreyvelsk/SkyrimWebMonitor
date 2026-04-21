import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/SkyrimWebMonitor/',
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
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: [
            '**/*.{js,css,html,ico,png}',
            'icons/**/*.svg',
            'fonts/**/*.{woff,woff2,ttf,otf}',
          ],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
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
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                cacheableResponse: {
                  statuses: [0, 200],
                },
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

