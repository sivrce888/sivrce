import { chromium } from 'playwright-core';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'en-US', viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
await page.goto('https://www.myhome.ge/en/real-estate/?currencyID=1&dealTypeID=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);
await page.evaluate(() => { [...document.querySelectorAll('button')].find(x => x.innerText.includes('Detailed filter'))?.click(); });
await page.waitForTimeout(2000);
// inspect clickable around 'Apartment'
const info = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(x => x.children.length === 0 && x.innerText === 'Apartment');
  return els.map(e => e.tagName + ' cls=' + e.className.slice(0,60) + ' parent=' + e.parentElement.tagName + '.' + String(e.parentElement.className).slice(0,60));
});
console.log(info.join('\n'));
await page.screenshot({ path: 'myhome_panel.png' });
// click via coordinates of first element
const r = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(x => x.children.length === 0 && x.innerText === 'Apartment');
  if (!els.length) return null;
  const b = els[0].getBoundingClientRect();
  return { x: b.x + b.width/2, y: b.y + b.height/2 };
});
if (r) { await page.mouse.click(r.x, r.y); }
await page.waitForTimeout(2500);
await page.screenshot({ path: 'myhome_panel_apt.png' });
const text = await page.evaluate(() => document.body.innerText);
const i = text.lastIndexOf('Detailed filter');
console.log('=== after apt click ===');
console.log(text.slice(i, i+3500));
await browser.close();
