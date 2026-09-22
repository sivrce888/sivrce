import { chromium } from 'playwright-core'
const pages = [
  ['developers', 'http://localhost:3000/developers'],
  ['developer-lattice', 'http://localhost:3000/developers/lattice-development'],
  ['projects', 'http://localhost:3000/projects'],
  ['project-luqs', 'http://localhost:3000/projects/luqs-taueri'],
  ['project-roof-gagarini', 'http://localhost:3000/projects/roof-gagarini'],
]
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
for (const [name, url] of pages) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `/tmp/shots/${name}.png`, fullPage: false })
    console.log(`OK ${name}`)
  } catch (e) {
    console.log(`FAIL ${name}: ${String(e).slice(0, 120)}`)
    try { await page.screenshot({ path: `/tmp/shots/${name}-partial.png` }) } catch {}
  }
}
await browser.close()
