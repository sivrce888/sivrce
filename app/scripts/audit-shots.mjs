// Full-site visual audit: screenshots + console/network error capture.
// Usage: node scripts/audit-shots.mjs  (needs dev server on :3100)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.AUDIT_BASE || 'http://localhost:3100'
const OUT = new URL('../../shots/audit-2026-07-19/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const ROUTES = [
  '/', '/en', '/ru',
  '/search', '/search?deal=rent', '/search?deal=daily', '/search?view=map',
  '/map',
  '/listing/axis-towers-pledge-1/iyideba-2-otaxiani-bina-vakeshi',
  '/projects', '/projects/alliance-centropolis',
  '/buildings', '/buildings/abashidze-34',
  '/developers', '/developers/alliance-group',
  '/agents', '/agents/ana-kvaratskhelia',
  '/neighborhoods', '/neighborhoods/chugureti',
  '/add-listing', '/mortgage-calculator',
  '/blog', '/blog/batumi-dghiuri-chris-shemosavalianoba',
  '/about', '/contact', '/faq', '/advertise',
  '/privacy', '/terms', '/auth/signin', '/favorites',
  '/tbilisi/kuchebi', '/sale/apartments-2/tbilisi',
]
const TABLET = new Set(['/', '/search', '/map'])
const VIEWPORTS = {
  m: { width: 390, height: 844 },
  d: { width: 1440, height: 900 },
  t: { width: 834, height: 1112 },
}

const slug = (r) => r.replace(/^\//, '').replace(/[/?=&]/g, '_') || 'home'
const problems = []

const browser = await chromium.launch()
for (const route of ROUTES) {
  for (const [key, vp] of Object.entries(VIEWPORTS)) {
    if (key === 't' && !TABLET.has(route)) continue
    const page = await browser.newPage({ viewport: vp })
    const errs = []
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message.slice(0, 600)}`))
    page.on('console', (m) => {
      const t = m.text()
      if (m.type() === 'error' && !t.includes('192.168')) errs.push(`console: ${t.slice(0, 600)}`)
    })
    page.on('response', (r) => {
      if (r.status() >= 400) errs.push(`http ${r.status()}: ${r.url().slice(0, 120)}`)
    })
    try {
      await page.goto(BASE + route, { waitUntil: 'load', timeout: 45_000 })
      await page.waitForTimeout(2_800)
      const hScroll = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      if (hScroll > 1) errs.push(`HORIZONTAL OVERFLOW +${hScroll}px`)
      await page.screenshot({ path: `${OUT}${slug(route)}-${key}.png`, fullPage: true })
    } catch (e) {
      errs.push(`NAV FAIL: ${String(e).slice(0, 160)}`)
    }
    if (errs.length) problems.push(`${route} [${key}]\n  ${errs.join('\n  ')}`)
    await page.close()
  }
  process.stdout.write(`${route} done\n`)
}
await browser.close()
import { writeFileSync } from 'node:fs'
writeFileSync(`${OUT}report.txt`, problems.join('\n\n') || 'none')
console.log('\n=== PROBLEMS ===')
console.log(problems.length ? problems.join('\n') : 'none')
