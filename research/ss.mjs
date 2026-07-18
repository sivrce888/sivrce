import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'ka-GE', viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
await page.goto('https://ss.ge/ka/udzravi-qoneba/l/bina/iyideba', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);
const t0 = await page.evaluate(() => document.body.innerText);
fs.writeFileSync('ss_serp.txt', t0);
console.log('=== SERP first 1200 ==='); console.log(t0.slice(0, 1200));
// list buttons
const btns = await page.evaluate(() => [...document.querySelectorAll('button,[role=button]')].map(b => b.innerText.trim().replace(/\n/g,' ')).filter(t => t && t.length < 40));
console.log('=== BUTTONS ==='); console.log([...new Set(btns)].slice(0, 40).join(' | '));
await browser.close();
