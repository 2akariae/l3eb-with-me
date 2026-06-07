import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir:    'dist',
    sourcemap: false,
    rollupOptions: {
      external: [], // agora-token is now in server.js — not bundled in frontend
    },
  },
  server: {
    host: true,
    // Proxy /api to Express server in local dev
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
