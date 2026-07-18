import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'ka-GE', viewport: { width: 1440, height: 1200 } });
const page = await ctx.newPage();
await page.goto('https://ss.ge/ka/udzravi-qoneba/l/bina/iyideba', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);
// find icon buttons in the search bar row (y between 60 and 100)
const clicked = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('button,[role=button],div,span')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.y > 55 && r.y < 110 && r.x > 580 && r.x < 720 && r.width < 60 && r.height < 50 && r.width > 10;
  });
  return cands.map(e => e.tagName + '|' + (e.getAttribute('aria-label')||'') + '|' + e.innerText.slice(0,20) + '|x' + Math.round(e.getBoundingClientRect().x));
});
console.log('candidates:', clicked.join('  ;  '));
await browser.close();
