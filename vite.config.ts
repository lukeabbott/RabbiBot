import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 8080,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
