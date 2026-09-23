import { defineConfig } from 'vite';

const proxy = {
  '/kirk': {
    target: 'https://backend-corteva-redhat-container.smartorg.com',
    changeOrigin: true,
  },
};

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy,
  },
  preview: {
    port: 4173,
    proxy,
  },
});