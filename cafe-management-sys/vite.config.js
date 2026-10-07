import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/vitest.setup.js',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/utils/**',
        'src/services/**',
        'src/adapters/**',
        'src/contexts/**',
        'src/hooks/**',
      ],
      thresholds: {
        statements: 66,
        branches: 50,
        functions: 68,
        lines: 68,
      },
    },
  },
});
