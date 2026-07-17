/* Final verification: chip flip, toggle click-through, services, wizard */
const { chromium } = require('playwright')

const OUT = '/Users/mac/Desktop/sivrce888/shots'
const BASE = 'http://localhost:3100'

;(async () => {
  const browser = await chromium.launch()

  // 1. FUNCTIONAL: click the toggle in light mode → html.dark appears
  let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  let page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.click('button[role="switch"]')
  await page.waitForTimeout(700)
  const htmlClass = await page.evaluate(() => document.documentElement.className)
  console.log('html class after toggle click:', htmlClass)
  console.log(htmlClass.includes('dark') ? 'TOGGLE-OK' : 'TOGGLE-FAIL')
  await page.screenshot({ path: `${OUT}/dm-toggle-clicked.png` })

  // 2. Dark categories + services (chip flip check)
  await ctx.close()
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => localStorage.setItem('sivrce:theme', 'dark'))
  page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.evaluate(() => window.scrollTo(0, 1350))
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/dm-dark-categories-fixed.png` })
  await page.evaluate(() => document.querySelector('#services')?.scrollIntoView())
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/dm-dark-services.png` })

  // 3. Wizard (add-listing) dark
  await page.goto(`${BASE}/add-listing`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${OUT}/dm-dark-wizard.png` })

  // 4. Mobile menu with new glass opacity
  await ctx.close()
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.addInitScript(() => localStorage.setItem('sivrce:theme', 'dark'))
  page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.tap('button[aria-expanded]')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/dm-mobile-dark-menu.png` })

  await browser.close()
  console.log('ALL-SHOTS-DONE')
})().catch((e) => { console.error(e); process.exit(1) })
