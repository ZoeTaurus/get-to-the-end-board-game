import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: Number(process.env.PORT) || 3000
    },
    preview: {
        host: true,
        port: Number(process.env.PORT) || 3000
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        assetsDir: 'assets',
    },
});
