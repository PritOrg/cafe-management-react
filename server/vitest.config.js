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
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname),
        },
    },
});
