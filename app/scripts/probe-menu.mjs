import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
await page.click('button[aria-controls="mobile-menu"]');
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/shots-mobile/verify-menu.png' });
// menu overflow check
const w = await page.evaluate(() => {
  const m = document.getElementById('mobile-menu');
  const r = m?.getBoundingClientRect();
  return { menuW: Math.round(r?.width ?? -1), docW: document.documentElement.scrollWidth, winW: window.innerWidth };
});
console.log(w);
await browser.close();
