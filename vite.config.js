import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '#': fileURLToPath(new URL('./src', import.meta.url)),  // Corrected syntax
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.smartvillageshub.com/api/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  optimizeDeps: {
    exclude: ['js-big-decimal']
  },
  preview: {
    host: '0.0.0.0'
  }
})
