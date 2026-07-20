const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
    test: {
        environment: 'node',
        include: ['**/*.test.js'],
        exclude: ['node_modules', 'dist', 'scratch'],
        globals: true,
        testTimeout: 10000,
        hookTimeout: 10000,
    },
});
