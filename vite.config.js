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

  // Base path for the deployed site. Defaults to the production path on
  // GitHub Pages, but can be overridden at build time (e.g. BASE_PATH=
  // /SkyrimWebMonitor/dev/ for the dev branch preview deploy).
  const basePath = process.env.BASE_PATH || '/SkyrimWebMonitor/';

  // The dev preview deploy must NOT cache anything: every reload should fetch
  // the latest build straight from the network. We also need to clean up any
  // service worker that an earlier version may have registered, so we ship a
  // self-destroying SW via vite-plugin-pwa's `selfDestroying` option.
  const isDevDeploy = basePath.endsWith('/dev/');

  return {
    base: basePath,
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
        // On the /dev/ preview deploy, emit a self-destroying service worker
        // so any previously-registered SW unregisters itself and clears its
        // caches on the next visit. New dev visitors never get an SW at all.
        selfDestroying: isDevDeploy,
        // The full app shell (HTML/JS/CSS + icons) is precached so the PWA
        // works completely offline. With `autoUpdate` + `skipWaiting` +
        // `clientsClaim`, vite-plugin-pwa regenerates the precache manifest
        // with hashed URLs on every build, so newly deployed versions are
        // picked up automatically as soon as the network is available
        // — without any manual cache clearing.
        includeAssets: ['pwa-svg.svg'],
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          // App shell (auto-generated globs) + every used icon.
          // pruneUnusedIcons has already removed unused SVGs from dist/.
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,webmanifest}',
            ...USED_ICONS.map((p) => `icons/${p}`),
          ],
          globIgnores: ['**/node_modules/**/*', 'fixtures.json'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // Serve index.html from precache for any SPA navigation when
          // offline; online requests still hit the network first via the
          // NetworkFirst handler below.
          navigateFallback: `${basePath}index.html`,
          // Never try to serve index.html for the WebSocket endpoint or
          // any non-SPA asset request.
          navigateFallbackDenylist: [/^\/ws/, /\/[^/?]+\.[^/]+$/],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            // SPA navigations: fresh HTML when online, precached shell when offline.
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 3,
                cacheableResponse: { statuses: [0, 200] },
              },
            },
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
          description:
            'Real-time companion app for The Elder Scrolls V: Skyrim. Monitors stats, inventory, magic and hotkeys over WebSocket.',
          theme_color: '#0d0d0d',
          background_color: '#0d0d0d',
          display: 'standalone',
          scope: basePath,
          start_url: basePath,
          icons: [
            {
              src: 'pwa-svg.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: 'pwa-svg.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
  };
});

