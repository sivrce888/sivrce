const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().replace('http://localhost:3100','')}`); });
  for (const p of ['/', '/search', '/listing/vake-chavchavadze-47', '/add-listing', '/projects', '/sale/apartments/tbilisi', '/favorites', '/about', '/contact', '/faq', '/gibberish-404']) {
    bad.length = 0;
    try {
      await page.goto('http://localhost:3100' + p, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(1500);
      console.log(p, '->', bad.length ? [...new Set(bad)].join(' | ') : 'clean');
    } catch (e) { console.log(p, '-> GOTO FAIL', e.message.split('\n')[0]); }
  }
  await browser.close();
})();
