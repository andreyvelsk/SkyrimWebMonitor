import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'node:fs';
import { execSync } from 'child_process';
import { collectUsedIcons } from './scripts/collect-used-icons.js';

function getAppVersion() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

// Static scan of src/** for every '<author>/<name>.svg' literal.
// All icons used by the app are referenced from source code, so this list
// is exhaustive. Used for both PWA precache and dist pruning below.
const SRC_DIR = path.resolve(__dirname, 'src');
const PUBLIC_ICONS_DIR = path.resolve(__dirname, 'public/icons');
const USED_ICONS = collectUsedIcons(SRC_DIR, PUBLIC_ICONS_DIR);

// Vite plugin: after build, remove every SVG under dist/icons that is not in
// USED_ICONS, then drop empty author folders. Keeps the deploy small and
// guarantees only used icons end up on the server.
function pruneUnusedIcons(distDir) {
  return {
    name: 'prune-unused-icons',
    apply: 'build',
    closeBundle() {
      const iconsDir = path.join(distDir, 'icons');
      if (!fs.existsSync(iconsDir)) return;
      const keep = new Set(USED_ICONS.map((p) => path.join(iconsDir, p)));
      let removed = 0;
      const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
            if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
          } else if (entry.isFile() && full.endsWith('.svg') && !keep.has(full)) {
            fs.unlinkSync(full);
            removed += 1;
          }
        }
      };
      walk(iconsDir);

      console.log(`[prune-unused-icons] kept ${USED_ICONS.length}, removed ${removed}`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const distDir = path.resolve(__dirname, 'dist');

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
      // Must run BEFORE VitePWA so workbox sees only the pruned icon set.
      pruneUnusedIcons(distDir),
      VitePWA({
        registerType: 'autoUpdate',
        // Precache only the SVG icons that are actually referenced from
        // source code. They are downloaded in one go on SW install. Everything
        // else (HTML/JS/CSS) goes strictly through the network so new deploys
        // are picked up automatically without manual cache clearing.
        includeAssets: [],
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          // Explicit per-file globs for the icons we use. globPatterns runs
          // against dist/, and pruneUnusedIcons has already removed the rest.
          globPatterns: USED_ICONS.map((p) => `icons/${p}`),
          // Defensive: never precache HTML/JS/CSS/PNG/manifest even if a
          // future workbox default tries to.
          globIgnores: [
            '**/node_modules/**/*',
            '**/*.{js,css,html,map,png,ico,webmanifest,json,txt}',
          ],
          maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
          // Do not intercept navigation: HTML is always fetched from network.
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            // Local fonts
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
            // Google Fonts files
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

