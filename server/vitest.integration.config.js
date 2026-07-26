const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
    test: {
        environment: 'node',
        include: ['__tests__/integration/**/*.test.js'],
        exclude: ['node_modules', 'dist', 'scratch'],
        globals: true,
        testTimeout: 30000,
        hookTimeout: 30000,
    },
});
