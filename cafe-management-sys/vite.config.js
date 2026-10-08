import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// WSL/D: the optimizer hangs when writing into the Windows mount and when
// bundling the full `@mui/icons-material` barrel (thousands of icons). Icons are
// imported as deep paths (one file each) so only the ~200 used icons are bundled.
// Discovery stays ON: `@mui/icons-material/*.js` and MUI's `@mui/system` internals
// are CommonJS on disk, so they MUST be pre-bundled for ESM interop (otherwise
// the browser gets "does not provide an export named ..." for darken/prop-types).
const OPTIMIZE_DEPS = [
  'react',
  'react-dom',
  'react-dom/client',
  'react-router-dom',
  '@mui/material',
  '@mui/material/styles',
  '@mui/material/utils',
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
  // Cache deps on the Linux-native fs (/tmp) instead of the Windows mount.
  cacheDir: process.env.VITE_CACHE_DIR || '/tmp/cafe-vite-cache',
  optimizeDeps: {
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
