import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', locale: 'ka-GE', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('https://ss.ge/ka/udzravi-qoneba/l/bina/iyideba', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
await page.tap ? null : null;
await page.mouse.click(76, 113); // ფილტრი button
await page.waitForTimeout(2500);
await page.screenshot({ path: 'ss_mobile_filter.png' });
const t = await page.evaluate(() => document.body.innerText);
fs.writeFileSync('ss_mobile_filter.txt', t);
console.log(t.slice(0, 3500));
await browser.close();
