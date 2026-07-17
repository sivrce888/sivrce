import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
await page.click('button[aria-controls="mobile-menu"]');
await page.waitForTimeout(600);
const info = await page.evaluate(() => {
  const m = document.getElementById('mobile-menu');
  const cs = getComputedStyle(m);
  return { bg: cs.backgroundColor, backdrop: cs.backdropFilter || cs.webkitBackdropFilter, opacity: cs.opacity, dark: document.documentElement.classList.contains('dark') };
});
console.log(info);
await browser.close();
