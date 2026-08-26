import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { open: true, port: 5173 },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1200 },
});
