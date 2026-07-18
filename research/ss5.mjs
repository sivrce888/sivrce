import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'ka-GE', viewport: { width: 1440, height: 1200 } });
const page = await ctx.newPage();
await page.goto('https://ss.ge/ka/udzravi-qoneba/l/bina/iyideba', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);
await page.mouse.click(689, 82); // sliders icon
await page.waitForTimeout(2500);
await page.screenshot({ path: 'ss_filter.png' });
const t = await page.evaluate(() => document.body.innerText);
fs.writeFileSync('ss_filter.txt', t);
// heuristics: print everything that looks like filter panel content
const i = t.indexOf('ფილტრი');
console.log(t.slice(Math.max(0,i-100), i+3000));
await browser.close();
