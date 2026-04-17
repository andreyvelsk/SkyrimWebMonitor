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
        // Explicitly include common static assets so they're precached
        includeAssets: [
          'pwa-192x192.png',
          'pwa-512x512.png',
          'icons/**',
          'fonts/**'
        ],
        // Workbox runtime caching rules for icons, svg and fonts
        workbox: {
          // Activate new service worker immediately and claim clients
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,png,svg,ico,webp,woff2,woff,ttf}'],
          runtimeCaching: [
            {
              // Ensure CSS updates come from network when possible
              urlPattern: /\.css$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'css-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
            {
              // Cache everything under /icons/ (from public/icons/...)
              urlPattern: /\/icons\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'icons-cache',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              // Fallback rule for SVG files
              urlPattern: /\.svg$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'svg-cache',
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              // Cache font files aggressively
              urlPattern: /\.(?:woff2|woff|ttf)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
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

