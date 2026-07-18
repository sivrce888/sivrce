import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'en-US', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://www.myhome.ge/en/real-estate/?currencyID=1&dealTypeID=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);
// open detailed filter
await page.evaluate(() => { [...document.querySelectorAll('button')].find(x => x.innerText.includes('Detailed filter'))?.click(); });
await page.waitForTimeout(2000);
// select Apartment type
await page.evaluate(() => { [...document.querySelectorAll('button,label,div,span')].find(x => x.innerText === 'Apartment' && x.closest('div'))?.click(); });
await page.waitForTimeout(2500);
const text = await page.evaluate(() => document.body.innerText);
fs.writeFileSync('myhome_filters_apt.txt', text);
const i = text.lastIndexOf('Detailed filter');
console.log(text.slice(i, i + 4000));
await browser.close();
