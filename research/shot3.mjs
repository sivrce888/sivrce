import { chromium } from 'playwright-core';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'en-US', viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
await page.goto('https://www.myhome.ge/en/real-estate/?currencyID=1&dealTypeID=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);
await page.evaluate(() => { [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'Accept all')?.click(); });
await page.waitForTimeout(800);
// sort dropdown
await page.evaluate(() => { [...document.querySelectorAll('button')].find(x => x.innerText.includes('Date descending'))?.click(); });
await page.waitForTimeout(1200);
const opts = await page.evaluate(() => {
  const pop = document.querySelector('[role=menu],[role=listbox],.luk-dropdown,[class*=dropdown],[class*=Dropdown],[class*=popover],[class*=Popover]');
  return pop ? pop.innerText : 'NO POPUP';
});
console.log('SORT:', JSON.stringify(opts));
await page.screenshot({ path: 'myhome_sort.png' });
// deal+type dropdown in the bar
await page.keyboard.press('Escape');
await page.evaluate(() => { [...document.querySelectorAll('button,div')].find(x => x.innerText.trim().startsWith('Transaction type'))?.click(); });
await page.waitForTimeout(1200);
const dd = await page.evaluate(() => document.body.innerText);
const i = dd.indexOf('Transaction type');
console.log('BAR DROPDOWN:', JSON.stringify(dd.slice(i, i+500)));
await browser.close();
