import { defineConfig } from '@playwright/test';

/** E2E smoke against the built SPA (vite preview) + the local API. */
export default defineConfig({
    testDir: 'e2e',
    timeout: 60000,
    use: {
        baseURL: 'http://localhost:4173',
        headless: true,
    },
    projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});