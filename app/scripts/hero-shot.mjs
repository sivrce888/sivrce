// One-shot hero screenshot against the already-running dev server (:3000).
import { chromium } from 'playwright'

const OUT = new URL('../../shots/hero-after.png', import.meta.url).pathname

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2200) // let the H1 word-rise + entrance settle
await page.screenshot({ path: OUT, fullPage: false })
await browser.close()
console.log('saved', OUT)
