import { chromium } from 'playwright-core';
const exe = '/Users/mac/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--disable-blink-features=AutomationControlled','--no-sandbox'] });
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', locale: 'ka-GE', viewport: { width: 1440, height: 1200 } });
const page = await ctx.newPage();
await page.goto('https://ss.ge/ka/udzravi-qoneba/l/bina/iyideba', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
const res = await page.evaluate(() => {
  const spans = [...document.querySelectorAll('span,button,div,a')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.y > 55 && r.y < 110 && r.x > 600 && r.x < 720 && r.width < 60;
  });
  return spans.map(e => `${e.tagName} x${Math.round(e.getBoundingClientRect().x)} cls=${String(e.className).slice(0,50)}`);
});
console.log(res.join('\n'));
// click parent chain of the x689 span
await page.evaluate(() => {
  const el = [...document.querySelectorAll('span')].find(el => { const r = el.getBoundingClientRect(); return r.y > 55 && r.y < 110 && r.x > 670 && r.x < 710; });
  if (el) { let n = el; for (let i=0;i<4 && n;i++) { if (n.onclick || n.tagName==='BUTTON' || n.tagName==='A' || n.getAttribute('role')==='button') break; n = n.parentElement; } (n||el).click(); }
});
await page.waitForTimeout(2500);
await page.screenshot({ path: 'ss_filter2.png' });
const t = await page.evaluate(() => document.body.innerText);
console.log('LEN', t.length);
// print segment around 'გამოწერა' or new keywords
for (const kw of ['საძინებ','სართულ','სარემონტო','გათბობა','აივანი','ოთახებ','სტატუსი']) {
  const i = t.indexOf(kw);
  if (i>=0) console.log('FOUND', kw, JSON.stringify(t.slice(Math.max(0,i-80), i+120)));
}
await browser.close();
