import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// WSL/D: note: dep pre-bundling is slow; pre-include the heavy deps so Vite
// bundles them once (avoids runtime re-optimize -> "connection lost" / blank page).
const OPTIMIZE_DEPS = [
  'react',
  'react-dom',
  'react-dom/client',
  'react-router-dom',
  '@mui/material',
  '@mui/material/styles',
  '@mui/utils',
  '@mui/system',
  '@emotion/react',
  '@emotion/styled',
  'styled-components',
  'sweetalert2',
  // CommonJS deps that must be pre-bundled for ESM interop
  'prop-types',
  'react-is',
  'hoist-non-react-statics',
  'react-transition-group',
  'clsx',
];

export default defineConfig({
  plugins: [react()],
  // On WSL/D: the optimizer writing into the Windows mount hangs, and crawling
  // node_modules (discovery) is very slow. Cache on Linux-native /tmp and skip
  // discovery, listing every dep MUI/React need (incl. CJS: prop-types, react-is).
  cacheDir: process.env.VITE_CACHE_DIR || '/tmp/cafe-vite-cache',
  optimizeDeps: {
    noDiscovery: true,
    include: OPTIMIZE_DEPS,
  },
  server: {
    port: 3000,
    strictPort: true,
    // Reduce file-watcher pressure on the shared Windows mount (WSL)
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/build/**',
        '**/coverage/**',
        '**/dist/**',
      ],
    },
    hmr: {
      overlay: true,
    },
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
