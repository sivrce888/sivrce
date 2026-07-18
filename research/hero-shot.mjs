import { chromium } from 'playwright-core';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('http://localhost:3407/ka', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(3000); // let sv-sky-in finish + twinkles settle
await page.screenshot({ path: '/Users/mac/Desktop/sivrce888/research/hero-after.png' });
await page.waitForTimeout(1800); // catch a different twinkle phase
await page.screenshot({ path: '/Users/mac/Desktop/sivrce888/research/hero-after-2.png' });
await browser.close();
