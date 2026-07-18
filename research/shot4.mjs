import { chromium } from 'playwright-core';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'en-US', viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
await page.goto('https://www.myhome.ge/en/real-estate/?currencyID=1&dealTypeID=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);
await page.evaluate(() => { [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Accept all')?.click(); });
await page.waitForTimeout(800);
// identify icon-only buttons
const btns = await page.evaluate(() => [...document.querySelectorAll('button')].map((b,i) => {
  const t = b.innerText.trim().replace(/\n/g,' ');
  const svg = b.querySelector('svg') ? 'svg' : '';
  const r = b.getBoundingClientRect();
  return i + '|' + t.slice(0,30) + '|' + svg + '|x' + Math.round(r.x) + 'y' + Math.round(r.y);
}).filter(s => !s.startsWith('undefined')));
console.log(btns.join('\n'));
await browser.close();
