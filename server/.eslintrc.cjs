module.exports = {
    root: true,
    env: { node: true, es2022: true },
    extends: ['eslint:recommended'],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'script' },
    rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-console': 'off',
        'no-undef': 'off',
    },
    ignorePatterns: ['node_modules/', 'coverage/', 'logs/', 'uploads/', 'build/'],
    overrides: [
        {
            files: ['test/**/*.js', 'vitest.config.js', '**/*.test.js'],
            parserOptions: { sourceType: 'module', ecmaVersion: 'latest' },
            env: { node: true },
        },
    ],
};
