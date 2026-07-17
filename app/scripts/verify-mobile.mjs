// ponytail: post-fix verification — tabs, menu, listing, map
import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const shot = (n) => page.screenshot({ path: `scripts/shots-mobile/verify-${n}.png` });

await page.goto('http://localhost:3000/search', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);
await shot('search-tabs');

// listing detail — grab first listing link from home
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
const href = await page.evaluate(() => document.querySelector('a[href^="/listing/"]')?.getAttribute('href'));
console.log('listing href:', href);
if (href) {
  await page.goto('http://localhost:3000' + href, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  await shot('listing-top');
  const docW = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log('listing docW:', docW);
}

// map page
await page.goto('http://localhost:3000/map', { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('map nav fail', e.message.split('\n')[0]));
await page.waitForTimeout(1500);
await shot('map');

// mobile menu
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
await page.click('button[aria-label*="მენიუ"], header button:last-child').catch(e => console.log('menu click fail'));
await page.waitForTimeout(900);
await shot('menu');
await browser.close();
console.log('done');
