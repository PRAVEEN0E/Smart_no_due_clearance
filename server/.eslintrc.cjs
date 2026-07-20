module.exports = {
    root: true,
    env: {
        node: true,
        es2022: true,
    },
    parserOptions: {
        ecmaVersion: 2022,
    },
    extends: ['eslint:recommended'],
    rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-console': 'off',
        'no-undef': 'error',
        'no-empty': 'warn',
        'no-prototype-builtins': 'off',
        'prefer-const': 'warn',
        'no-var': 'warn',
        'eqeqeq': ['warn', 'smart'],
        'curly': ['warn', 'multi-line'],
        'no-throw-literal': 'warn',
    },
    ignorePatterns: ['node_modules/', 'dist/', 'uploads/'],
};
