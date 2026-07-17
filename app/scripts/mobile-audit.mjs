// ponytail: one-shot mobile visual audit, not a test suite
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = new URL('./shots-mobile/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const pages = ['/', '/search', '/projects', '/about', '/blog', '/mortgage-calculator', '/en', '/ru'];
const viewports = [
  { name: 'iphone', width: 390, height: 844 },   // iPhone 14
  { name: 'se', width: 375, height: 667 },        // iPhone SE
  { name: 'tablet', width: 768, height: 1024 },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: vp.name !== 'tablet', hasTouch: true });
  const page = await ctx.newPage();
  for (const p of pages) {
    const name = `${vp.name}${p.replace(/\//g, '_') || '_home'}`;
    try {
      await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${OUT}${name}-top.png` });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}${name}-mid.png` });
      // overflow check: any element wider than viewport?
      const wide = await page.evaluate(() => {
        const bad = [];
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width > window.innerWidth + 1 && r.height > 0) {
            const cls = (el.className && el.className.toString().slice(0, 80)) || el.tagName;
            bad.push(`${el.tagName}.${cls} w=${Math.round(r.width)}`);
          }
        }
        return { scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth, bad: bad.slice(0, 12) };
      });
      if (wide.bad.length || wide.scrollW > wide.innerW + 1) console.log(`OVERFLOW ${name}: scrollW=${wide.scrollW}`, wide.bad);
    } catch (e) { console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`); }
  }
  await ctx.close();
}
await browser.close();
console.log('done ->', OUT);
