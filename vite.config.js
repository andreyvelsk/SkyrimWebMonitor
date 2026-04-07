import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

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
          target: env.VITE_WS_SERVER_URL || 'ws://192.168.46.190:8765',
          ws: true,
          rewriteWsOrigin: true,
        },
      },
    },
    plugins: [
      vue(),
      VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SkyrimWebMonitor',
        short_name: 'Skyrim Monitor',
        description: 'Web Monitor for Skyrim',
        theme_color: '#ffffff',
        background_color: '#ffffff',
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
  }
})

