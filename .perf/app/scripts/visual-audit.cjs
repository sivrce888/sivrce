// Visual audit: every page × desktop/mobile/tablet, scroll-triggered reveals, console errors.
const { chromium } = require('playwright');
const fs = require('fs');

const OUT = require('path').join(__dirname, '../../shots/audit');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const viewports = [
    { name: 'desktop', width: 1440, height: 900, dsf: 1 },
    { name: 'mobile', width: 390, height: 844, dsf: 2 },
    { name: 'tablet', width: 834, height: 1112, dsf: 1 },
  ];
  const pages = [
    { path: '/', name: 'home' },
    { path: '/search', name: 'search' },
    { path: '/listing/vake-chavchavadze-47', name: 'listing' },
    { path: '/add-listing', name: 'add' },
    { path: '/projects', name: 'projects' },
    { path: '/sale/apartments/tbilisi', name: 'seo' },
    { path: '/favorites', name: 'favorites' },
    { path: '/about', name: 'about' },
    { path: '/contact', name: 'contact' },
    { path: '/faq', name: 'faq' },
    { path: '/gibberish-404', name: 'notfound' },
  ];
  for (const vp of viewports) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dsf,
    });
    for (const pg of pages) {
      const page = await ctx.newPage();
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(`[${vp.name}/${pg.name}] ${m.text()}`);
      });
      page.on('pageerror', (e) => errors.push(`[${vp.name}/${pg.name}] PAGEERROR ${e.message}`));
      try {
        const resp = await page.goto(`http://localhost:3100${pg.path}`, { waitUntil: 'load', timeout: 20000 });
        if (!resp || resp.status() >= 500) errors.push(`[${vp.name}/${pg.name}] HTTP ${resp && resp.status()}`);
        await page.waitForTimeout(1200);
      // slow scroll to trigger whileInView reveals
      await page.evaluate(
        () =>
          new Promise((res) => {
            let y = 0;
            const step = () => {
              y += window.innerHeight * 0.7;
              window.scrollTo(0, y);
              if (y < document.body.scrollHeight) setTimeout(step, 150);
              else res();
            };
            step();
          })
      );
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${OUT}/${vp.name}-${pg.name}-full.png`, fullPage: true });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/${vp.name}-${pg.name}-top.png` });
      // horizontal overflow check
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0) errors.push(`[${vp.name}/${pg.name}] HORIZONTAL OVERFLOW ${overflow}px`);
      await page.close();
      } catch (e) {
        errors.push(`[${vp.name}/${pg.name}] GOTO FAIL ${e.message.split('\n')[0]}`);
        await page.close().catch(() => {});
      }
    }
    await ctx.close();
  }
  console.log('CONSOLE ERRORS:\n' + (errors.join('\n') || 'none'));
  await browser.close();
})();
