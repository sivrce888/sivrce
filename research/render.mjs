import { chromium } from 'playwright-core';
import fs from 'fs';

const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [,, url, out, clickText] = process.argv;
const browser = await chromium.launch({ executablePath: exe, headless: true,
  args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  locale: 'ka-GE', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(6000);
  if (clickText) {
    try {
      await page.getByText(clickText, { exact: false }).first().click({ timeout: 5000 });
      await page.waitForTimeout(2500);
    } catch (e) { console.error('click failed:', e.message); }
  }
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(out, text);
  console.log('TITLE:', await page.title());
  console.log('URL:', page.url());
  console.log(text.slice(0, 3000));
} catch (e) { console.error('ERR', e.message); }
await browser.close();
