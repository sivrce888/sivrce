// ponytail: realistic-scroll check — do cards reveal when scrolling like a user?
import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
// slow user-like scroll to listings rail (find it first)
const railY = await page.evaluate(() => {
  const el = document.querySelector('[role="region"][aria-label*="SUPER VIP"]');
  return el ? el.getBoundingClientRect().top + window.scrollY : 0;
});
await page.evaluate(async (target) => {
  for (let y = 0; y <= target; y += 150) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
}, Math.max(0, railY - 500));
await page.waitForTimeout(1500);
await page.screenshot({ path: new URL('./shots-mobile/home-listings-slow.png', import.meta.url).pathname });
const op = await page.evaluate(() =>
  [...document.querySelectorAll('article')].slice(0, 3).map(a => getComputedStyle(a).opacity)
);
console.log('card opacities after slow scroll:', op);
await browser.close();
