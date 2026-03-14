import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        // Exclude UI components from coverage requirements (tested manually in browser)
        'src/components/**',
        'src/App.tsx',
        // Exclude re-export index files
        '**/index.ts',
        '**/index.tsx',
      ],
      thresholds: {
        // Applied to business logic: services, stores, config, utils
        lines: 80,
        functions: 85,
        branches: 65,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
