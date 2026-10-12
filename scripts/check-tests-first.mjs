// Phase P policy: changes to app code must ship with test changes (tests-first).
// Non-blocking in CI; warns (exit 1) when a PR touches app source but no test.
import { execSync } from 'node:child_process';

const base = process.env.BASE_SHA || 'origin/main';
const head = process.env.HEAD_SHA || 'HEAD';
const diff = execSync(`git diff --name-only ${base}...${head}`).toString().trim().split('\n').filter(Boolean);

const APP_RE = [
    /^cafe-management-sys\/src\//,
    /^server\/(services|controllers|repositories|middleware|utils|routes)\//,
    /^server\/mail\//,
];
const isApp = (p) => APP_RE.some((re) => re.test(p));
const isTest = (p) => /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(p);

const appFiles = diff.filter(isApp);
const testFiles = diff.filter(isTest);

console.log(`app files changed: ${appFiles.length}; test files changed: ${testFiles.length}`);
if (appFiles.length && testFiles.length === 0) {
    console.error('TDD policy: app/source changes without any test changes in this branch.');
    console.error('Add a test that would have failed before your change, then push.');
    process.exit(1);
}
console.log('tests-first: OK');