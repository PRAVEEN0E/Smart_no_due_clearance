const { test, expect } = require('@playwright/test');

test.describe('SEO — Public Marketing Pages', () => {
    test('landing page renders unique title, H1, canonical and FAQ JSON-LD', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('h1').first()).toContainText('No More Queues for No-Dues', { timeout: 15000 });
        await expect(page).toHaveTitle(/NoDueNest — Smart Student Clearance/);
        const canonical = await page.locator('link[rel="canonical"]').last().getAttribute('href');
        expect(canonical).toContain('smart-no-due-clearance.vercel.app/');
        const jsonLd = await page.locator('script[type="application/ld+json"]').allInnerTexts();
        const all = jsonLd.join(' ');
        expect(all).toContain('FAQPage');
        expect(all).toContain('SoftwareApplication');
        expect(all).toContain('Organization');
        const ogImage = await page.locator('meta[property="og:image"]').last().getAttribute('content');
        expect(ogImage).toContain('og-image.png');
    });

    test('about page renders its own H1 and breadcrumb schema', async ({ page }) => {
        await page.goto('/about');
        await expect(page.locator('h1').first()).toContainText('We Built What Students', { timeout: 15000 });
        const jsonLd = await page.locator('script[type="application/ld+json"]').allInnerTexts();
        expect(jsonLd.join(' ')).toContain('BreadcrumbList');
    });

    test('features page renders', async ({ page }) => {
        await page.goto('/features');
        await expect(page.locator('h1').first()).toContainText('Powerful Tools', { timeout: 15000 });
        await expect(page.locator('h1').first()).toContainText('Zero Paperwork');
    });

    test('contact page renders form with associated labels', async ({ page }) => {
        await page.goto('/contact');
        await expect(page.locator('h1').first()).toContainText("Let's Talk", { timeout: 15000 });
        const labels = await page.locator('form label').count();
        expect(labels).toBeGreaterThan(0);
        const labelFor = await page.locator('form label').first().getAttribute('for');
        expect(labelFor).toBeTruthy();
    });

    test('privacy and terms pages render', async ({ page }) => {
        await page.goto('/privacy');
        await expect(page.locator('h1').first()).toContainText('Privacy Policy', { timeout: 15000 });
        await page.goto('/terms');
        await expect(page.locator('h1').first()).toContainText('Terms of Service', { timeout: 15000 });
    });

    test('verify landing page renders', async ({ page }) => {
        await page.goto('/verify');
        await expect(page.locator('h1').first()).toContainText('Authenticate Any', { timeout: 15000 });
    });

    test('unknown route renders client-side 404 page', async ({ page }) => {
        await page.goto('/this-route-does-not-exist-xyz');
        await expect(page.locator('h1').first()).toContainText('404', { timeout: 15000 });
        await expect(page.locator('text=This page wandered off campus')).toBeVisible();
    });

    test('login page still works and is noindex', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 10000 });
        const robots = await page.locator('meta[name="robots"]').last().getAttribute('content');
        expect(robots).toContain('noindex');
        await expect(page.locator('h1').first()).toContainText('NoDueNest');
    });
});
