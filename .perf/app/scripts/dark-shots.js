/* Screenshot light/dark states for visual verification */
const { chromium } = require('playwright')

const OUT = '/Users/mac/Desktop/sivrce888/shots'
const BASE = 'http://localhost:3100'

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('saved', name)
}

;(async () => {
  const browser = await chromium.launch()

  // Desktop LIGHT
  let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  let page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await shot(page, 'dm-home-light-top')
  await page.evaluate(() => window.scrollTo(0, 1400))
  await page.waitForTimeout(900)
  await shot(page, 'dm-home-light-mid')

  // Desktop DARK (pre-seed theme before app scripts run)
  await ctx.close()
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => localStorage.setItem('sivrce:theme', 'dark'))
  page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await shot(page, 'dm-home-dark-top')
  await page.evaluate(() => window.scrollTo(0, 1400))
  await page.waitForTimeout(900)
  await shot(page, 'dm-home-dark-mid')
  await page.evaluate(() => window.scrollTo(0, 3400))
  await page.waitForTimeout(900)
  await shot(page, 'dm-home-dark-low')

  await page.goto(`${BASE}/search`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await shot(page, 'dm-search-dark')

  await page.goto(`${BASE}/listing/vake-chavchavadze-47`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await shot(page, 'dm-listing-dark')

  // Mobile DARK + open menu
  await ctx.close()
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.addInitScript(() => localStorage.setItem('sivrce:theme', 'dark'))
  page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await shot(page, 'dm-mobile-dark')
  await page.tap('button[aria-expanded]')
  await page.waitForTimeout(600)
  await shot(page, 'dm-mobile-dark-menu')

  await browser.close()
})().catch((e) => { console.error(e); process.exit(1) })
