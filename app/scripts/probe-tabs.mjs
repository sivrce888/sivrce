// ponytail: geometry probe for the clipped search tabs
import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/search', { waitUntil: 'networkidle', timeout: 60000 });
const info = await page.evaluate(() => {
  const seg = document.querySelector('[role="group"][aria-label]');
  const out = { seg: null, chain: [] };
  if (seg) {
    const r = seg.getBoundingClientRect();
    out.seg = { left: Math.round(r.left), right: Math.round(r.right), scrollW: seg.scrollWidth, clientW: seg.clientWidth };
    let el = seg;
    while (el && el !== document.body) {
      const b = el.getBoundingClientRect();
      out.chain.push(`${el.tagName}.${(el.className || '').toString().slice(0, 50)} L=${Math.round(b.left)} R=${Math.round(b.right)}`);
      el = el.parentElement;
    }
  }
  out.docW = document.documentElement.scrollWidth;
  out.winW = window.innerWidth;
  return out;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
