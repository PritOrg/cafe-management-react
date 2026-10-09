/**
 * Lighthouse CI. Runs against the production build (vite preview), mobile preset.
 * Assertions are `warn` initially so it never blocks a PR — tighten to `error`
 * and ratchet once the baseline is stable (see docs/lighthouse.md).
 *
 * Run locally:  npm run build && npx --yes @lhci/cli@0.14 autorun
 * (For /menu to score real content, the API must be running on VITE_API_URL.)
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --port 4173 --strictPort',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      url: ['http://localhost:4173/'],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
