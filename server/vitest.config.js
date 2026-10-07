import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['test/**/*.test.js'],
        setupFiles: ['./test/setup.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: [
                'utils/**/*.js',
                'middleware/**/*.js',
                'services/**/*.js',
                'repositories/**/*.js',
                'controllers/**/*.js',
                'constants/**/*.js',
                'db/mappers.js',
            ],
            exclude: ['test/**', 'node_modules/**', 'logs/**'],
            thresholds: {
                statements: 66,
                branches: 50,
                functions: 66,
                lines: 68,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname),
        },
    },
});
