module.exports = {
    root: true,
    env: { browser: true, es2021: true, node: false },
    extends: ['eslint:recommended'],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-console': 'warn',
    },
    overrides: [
        {
            files: ['*.jsx', '*.js'],
            rules: {
                'no-unused-vars': 'warn',
            },
        },
    ],
};
