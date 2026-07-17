// ponytail: trimmed one-shot visual audit; mobile sister is ./scripts/mobile-audit.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = new URL('../shots/visual-2026-07-18/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const pages = ['/', '/search', '/projects', '/mortgage-calculator', '/add-listing', '/about'];
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const p of pages) {
    const name = `${vp.name}${p.replace(/\//g, '_') || '_home'}`;
    try {
      await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${OUT}${name}-top.png` });
      const wide = await page.evaluate(() => {
        const bad = [];
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width > window.innerWidth + 1 && r.height > 0) {
            const cls = (el.className && el.className.toString().slice(0, 80)) || el.tagName;
            bad.push(`${el.tagName}.${cls} w=${Math.round(r.width)}`);
          }
        }
        return { scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth, bad: bad.slice(0, 10) };
      });
      if (wide.bad.length || wide.scrollW > wide.innerW + 1) console.log(`OVERFLOW ${name}: scrollW=${wide.scrollW}`, wide.bad);
    } catch (e) { console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`); }
  }
  await ctx.close();
}
await browser.close();
console.log('done ->', OUT);
