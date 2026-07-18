import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'en-US', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const [,, url, out, mode] = process.argv;
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);
if (mode === 'click') {
  await page.getByRole('button', { name: /Detailed filter/i }).first().click({ timeout: 8000 });
  await page.waitForTimeout(3000);
}
const text = await page.evaluate(() => document.body.innerText);
fs.writeFileSync(out, text);
console.log('URL:', page.url());
console.log('lines:', text.split('\n').length);
await browser.close();
