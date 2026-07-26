const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
    test: {
        environment: 'node',
        include: ['**/*.test.js'],
        exclude: ['node_modules', 'dist', 'scratch'],
        globals: true,
        testTimeout: 10000,
        hookTimeout: 10000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: './coverage',
            include: ['repositories/**', 'services/**', 'constants/**', 'lib/**', 'controllers/**'],
        },
    },
});
