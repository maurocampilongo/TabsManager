import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/TabsManager/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TabManager',
        short_name: 'TabManager',
        description: 'Setlists y acordes para guitarristas',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/TabsManager/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/itunes\.apple\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'itunes-api', expiration: { maxEntries: 200, maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: /^https:\/\/musicbrainz\.org\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'musicbrainz-api', expiration: { maxEntries: 200, maxAgeSeconds: 86400 } },
          },
        ],
      },
    }),
  ],
})
