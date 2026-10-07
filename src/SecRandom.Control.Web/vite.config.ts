import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5273,
    
    
    proxy: {
      '/api': { target: 'http://127.0.0.1:8791', changeOrigin: false },
      '/v1': { target: 'http://127.0.0.1:8791', changeOrigin: false, ws: true },
      '/healthz': { target: 'http://127.0.0.1:8791', changeOrigin: false },
    },
  },

  build: {
    outDir: '../../artifacts/web',
    emptyOutDir: true,
    
    sourcemap: false,
  },

  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],

    





    alias: {
      '/favicon-32.png': fileURLToPath(new URL('./public/favicon-32.png', import.meta.url)),
      '/apple-touch-icon.png': fileURLToPath(
        new URL('./public/apple-touch-icon.png', import.meta.url),
      ),
    },
  },
})
