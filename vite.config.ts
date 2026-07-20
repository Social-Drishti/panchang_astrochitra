import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*.woff2', 'icons/*.png', 'bg-body.webp'],
      manifest: {
        name: 'Panchang Astrochitra',
        short_name: 'Panchang',
        description: 'Daily Vedic Panchang – Tithi, Nakshatra, Muhurta, Graha positions & transits',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5e6c8',
        theme_color: '#654e12',
        orientation: 'portrait-primary',
        lang: 'en-IN',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],
});
