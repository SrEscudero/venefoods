import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Venefoods - Sabor Venezolano',
        short_name: 'Venefoods',
        description: 'Tienda de productos venezolanos en Passo Fundo',
        theme_color: '#ffffff',
        background_color: '#F2F2F7',
        display: 'standalone', // Esto quita la barra del navegador
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png', // Tendremos que crear estos iconos luego
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.jsx', // Crearemos este archivo ahora
    css: false,
  },
  server: {
    host: true,
    port: 5173,
  }
})