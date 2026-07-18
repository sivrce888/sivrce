import { chromium } from 'playwright-core';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'ka-GE', viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
await page.goto('https://ss.ge/ka/udzravi-qoneba/l/bina/iyideba', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: 'ss_serp.png' });
// click each bar field to see dropdowns
for (const label of ['იყიდება','ბინა','მდებარეობა','ფასი','ფართი']) {
  await page.evaluate((l) => {
    const el = [...document.querySelectorAll('button,div,span')].find(x => x.innerText.trim() === l && x.getBoundingClientRect().y < 200 && x.getBoundingClientRect().width < 300);
    el?.click();
  }, label);
  await page.waitForTimeout(1500);
  const t = await page.evaluate(() => document.body.innerText);
  const i = t.indexOf(label);
  console.log(`=== ${label} ===`);
  console.log(t.slice(i, i+350).replace(/\n+/g,' | '));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
}
await browser.close();
