import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/search', { waitUntil: 'networkidle', timeout: 60000 });
const info = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('main button')].find(b => b.textContent.trim().startsWith('ყველა'));
  if (!btn) return 'not found';
  const seg = btn.closest('[role="group"]');
  const r = seg.getBoundingClientRect();
  const chain = [];
  let el = seg;
  while (el && el !== document.body) {
    const b = el.getBoundingClientRect();
    chain.push(`${el.tagName}.${(el.className || '').toString().slice(0, 60)} L=${Math.round(b.left)} R=${Math.round(b.right)}`);
    el = el.parentElement;
  }
  return { seg: { L: Math.round(r.left), R: Math.round(r.right), scrollW: seg.scrollWidth, clientW: seg.clientWidth }, chain, docW: document.documentElement.scrollWidth };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
