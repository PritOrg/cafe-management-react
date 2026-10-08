import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// WSL/D: the optimizer hangs when writing into the Windows mount and when
// bundling the full `@mui/icons-material` barrel (thousands of icons). Icons are
// imported as deep paths (one file each) so only the ~200 used icons are bundled.
// Discovery stays ON so MUI's CommonJS deep modules get ESM interop.
//
// IMPORTANT: `@mui/icons-material/<Icon>.js` is CommonJS and rolldown's interop
// exposes it as `export default require_X()` — the *namespace* object, so
// `import Home from '@mui/icons-material/Home'` yields an object and React throws
// "Element type is invalid ... got: object". We alias icon subpaths to MUI's real
// ESM build (`esm/Home.js` -> `export default createSvgIcon(...)`), which resolves
// correctly. (@mui/material deep paths are already ESM, so no alias needed.)
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
  resolve: {
    alias: [
      {
        find: /^@mui\/icons-material\/(?!esm\/)(.*)$/,
        replacement: '@mui/icons-material/esm/$1',
      },
    ],
  },
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
