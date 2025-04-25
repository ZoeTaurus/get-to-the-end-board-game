import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    target: 'es2015'
  },
  server: {
    port: process.env.PORT || 3000,
    host: true
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
  }
}) 