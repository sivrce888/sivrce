import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'ka-GE', viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
await page.goto('https://ss.ge/ka/udzravi-qoneba/l/bina/iyideba', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);
// all clickable-ish elements with short text or aria
const els = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('button, a, [role=button], input').forEach(el => {
    const t = (el.innerText || el.getAttribute('aria-label') || el.placeholder || '').trim().replace(/\n/g,' ');
    if (t && t.length < 50) { const r = el.getBoundingClientRect(); out.push(`${el.tagName}|${t}|x${Math.round(r.x)}y${Math.round(r.y)}`); }
  });
  return [...new Set(out)];
});
console.log(els.slice(0, 50).join('\n'));
// click sort
await page.evaluate(() => { [...document.querySelectorAll('button')].find(x => x.innerText.trim() === 'სორტირება')?.click(); });
await page.waitForTimeout(1500);
const st = await page.evaluate(() => document.body.innerText);
const i = st.indexOf('სორტირება');
console.log('=== SORT POPUP ==='); console.log(st.slice(i, i+400));
await browser.close();
