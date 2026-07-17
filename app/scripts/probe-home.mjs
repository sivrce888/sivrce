// ponytail: one-shot probe for the home mid-page blank gap
import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
// user-like stepped scroll to bottom so IntersectionObservers fire
await page.evaluate(async () => {
  const h = document.body.scrollHeight;
  for (let y = 0; y <= h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(1000);
await page.screenshot({ path: new URL('./shots-mobile/home-full.png', import.meta.url).pathname, fullPage: true });
// find elements still invisible (opacity 0) with real size
const hidden = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('main *')) {
    const r = el.getBoundingClientRect();
    if (r.height > 100 && r.width > 200) {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) < 0.05) out.push(`${el.tagName}.${(el.className || '').toString().slice(0, 60)} h=${Math.round(r.height)}`);
    }
  }
  return out.slice(0, 10);
});
console.log('still-hidden:', hidden);
await browser.close();
