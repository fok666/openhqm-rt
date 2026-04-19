import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/openhqm-rt/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['jq-web'],
  },
  assetsInclude: ['**/*.wasm'],
  server: {
    port: 5173,
    open: true,
  },
}));
