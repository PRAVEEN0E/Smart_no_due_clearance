const sharp = require('sharp');
const path = require('path');

const client = path.resolve(__dirname, '..');
const faviconSvg = path.join(client, 'public', 'favicon.svg');

(async () => {
    // 1. OG image 1200x630 — branded gradient + shield + wordmark
    const shield = await sharp(faviconSvg).resize(260, 260).png().toBuffer();

    const ogSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0B1F3A"/>
          <stop offset="1" stop-color="#173b6b"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.8" cy="0.15" r="0.6">
          <stop offset="0" stop-color="#2563EB" stop-opacity="0.35"/>
          <stop offset="1" stop-color="#2563EB" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="glow2" cx="0.15" cy="0.9" r="0.5">
          <stop offset="0" stop-color="#F26A21" stop-opacity="0.22"/>
          <stop offset="1" stop-color="#F26A21" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect width="1200" height="630" fill="url(#glow)"/>
      <rect width="1200" height="630" fill="url(#glow2)"/>
      <text x="600" y="405" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="108" font-weight="800" font-style="italic" letter-spacing="-2" fill="#ffffff">NoDueNest</text>
      <text x="600" y="470" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="600" letter-spacing="4" fill="#fbbf24">SMART CLEARANCE · AI REVIEWS · VERIFIED HALL TICKETS</text>
    </svg>`);

    await sharp(ogSvg)
        .composite([{ input: shield, top: 78, left: 470 }])
        .png()
        .toFile(path.join(client, 'public', 'og-image.png'));
    console.log('og-image.png written');

    // 2. favicon.ico from the 32x32 png
    const png32 = path.join(client, 'public', 'favicon-32x32.png');
    await sharp(png32).png().resize(32, 32).toFile(path.join(client, 'public', 'favicon.ico'));
    console.log('favicon.ico written');
})();
