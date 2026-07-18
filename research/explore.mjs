import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'en-US', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://www.myhome.ge/en/real-estate/?currencyID=1&dealTypeID=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);
const els = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('button, a, [role=button], input, select').forEach(el => {
    const t = (el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') || '').trim();
    if (t && t.length < 60) out.push(el.tagName + ': ' + t.replace(/\n/g,' | '));
  });
  return [...new Set(out)];
});
console.log(els.slice(0, 80).join('\n'));
await browser.close();
