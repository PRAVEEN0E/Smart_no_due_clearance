const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: '.',
    timeout: 30000,
    retries: 1,
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
});
