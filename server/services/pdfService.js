const puppeteerCore = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

/**
 * Shared utility to launch a puppeteer browser instance compatible with 
 * local development and Render (using @sparticuz/chromium).
 */
async function getBrowser() {
    const isLocal = !process.env.RENDER;
    
    if (isLocal) {
        // In local dev, we use the standard 'puppeteer' package which downloads its own chrome
        try {
            const puppeteer = require('puppeteer');
            return await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
        } catch (err) {
            console.error("Local puppeteer launch failed, trying puppeteer-core", err);
            // Fallback to puppeteer-core if standard puppeteer isn't configured
            return await puppeteerCore.launch({
                headless: 'new',
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Typical Windows path
                args: ['--no-sandbox']
            });
        }
    } else {
        // On Render, we must use puppeteer-core + @sparticuz/chromium
        return await puppeteerCore.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless
        });
    }
}

module.exports = { getBrowser };
