import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './docs',
  },

  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      manifest: {
        background_color: '#000000',
        theme_color: '#7E1F86',
        name: 'autoCheese',
        short_name: 'autoCheese',
        start_url: '/Chess',
        display: 'standalone',
        icons: [
          {
            src: '/Chess/assets/android-chrome-192x192.58efdd54.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  base: './',
});
