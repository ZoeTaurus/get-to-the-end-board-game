import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: process.env.PORT || 3000
  },
  preview: {
    host: true,
    port: process.env.PORT || 3000,
    allowedHosts: [
      'get-to-the-end-board-game-production.up.railway.app',
      '.railway.app',
      'localhost',
      '127.0.0.1'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
}) 