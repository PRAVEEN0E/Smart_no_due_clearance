const puppeteerCore = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

let browserInstance = null;

/**
 * Shared utility to launch a puppeteer browser instance compatible with 
 * local development and Render (using @sparticuz/chromium).
 */
async function getBrowser() {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }

    const isLocal = !process.env.RENDER;
    
    if (isLocal) {
        try {
            const puppeteer = require('puppeteer');
            browserInstance = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        } catch (err) {
            console.error("Puppeteer launch failed:", err);
            throw err;
        }
    } else {
        // On Render, we must use puppeteer-core + @sparticuz/chromium
        browserInstance = await puppeteerCore.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless
        });
    }
    
    return browserInstance;
}

module.exports = { getBrowser };
