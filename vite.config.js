import { defineConfig } from 'vite';
import { pwa } from './build/pwa.js';

export default defineConfig({
  base: './',
  plugins: [pwa()],
  server: { open: true, port: 5173 },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1200 },
});
