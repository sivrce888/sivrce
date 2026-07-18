import { chromium } from 'playwright-core';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', locale: 'ka-GE', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('https://ss.ge/ka/udzravi-qoneba/l/bina/iyideba', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: 'ss_mobile.png' });
const btns = await page.evaluate(() => [...document.querySelectorAll('button,a,[role=button]')].map(b => (b.innerText||b.getAttribute('aria-label')||'').trim().replace(/\n/g,' ')).filter(t => t && t.length < 40));
console.log([...new Set(btns)].slice(0, 30).join(' | '));
// click ფილტრი if exists
const hasFilter = await page.evaluate(() => { const b = [...document.querySelectorAll('button,a,div')].find(x => x.innerText && x.innerText.trim() === 'ფილტრი'); if (b) { b.click(); return true; } return false; });
console.log('filter clicked:', hasFilter);
await page.waitForTimeout(2500);
await page.screenshot({ path: 'ss_mobile_filter.png' });
const t = await page.evaluate(() => document.body.innerText);
const i = t.indexOf('ფილტრი');
console.log(t.slice(Math.max(0,i-50), i+2500));
await browser.close();
