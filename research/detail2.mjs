import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'en-US', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://www.myhome.ge/en/real-estate/?currencyID=1&dealTypeID=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);
const clicked = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const b = btns.find(x => x.innerText.replace(/[0-9]/g,'').trim() === 'Detailed filter');
  if (b) { b.click(); return b.innerText; }
  return null;
});
console.log('clicked:', clicked);
await page.waitForTimeout(3500);
const text = await page.evaluate(() => document.body.innerText);
fs.writeFileSync('myhome_filters.txt', text);
console.log('URL:', page.url(), 'lines:', text.split('\n').length);
await browser.close();
