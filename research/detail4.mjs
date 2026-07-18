import { chromium } from 'playwright-core';
import fs from 'fs';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'en-US', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://www.myhome.ge/en/real-estate/?currencyID=1&dealTypeID=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);
await page.evaluate(() => { [...document.querySelectorAll('button')].find(x => x.innerText.includes('Detailed filter'))?.click(); });
await page.waitForTimeout(1500);
// use playwright locator to click Apartment option
try { await page.getByText('Apartment', { exact: true }).last().click({ timeout: 4000 }); } catch(e) { console.log('apt click err', e.message); }
await page.waitForTimeout(2000);
const text = await page.evaluate(() => document.body.innerText);
fs.writeFileSync('myhome_filters_apt2.txt', text);
const i = text.lastIndexOf('Detailed filter');
console.log(text.slice(i, i+3000));
// also dump homepage
const p2 = await ctx.newPage();
await p2.goto('https://www.myhome.ge/en/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p2.waitForTimeout(5000);
const t2 = await p2.evaluate(() => document.body.innerText);
fs.writeFileSync('myhome_home.txt', t2);
console.log('=== HOME ==='); console.log(t2.slice(0, 2500));
await browser.close();
