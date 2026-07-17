// Visual sweep: boot dev server, screenshot key routes at desktop + mobile, kill server.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const APP_DIR = new URL('..', import.meta.url).pathname
const OUT = new URL('../../shots/sweep', import.meta.url).pathname
const PORT = 3100
const BASE = `http://localhost:${PORT}`

const ROUTES = [
  '/', '/sale', '/rent', '/daily', '/search', '/map', '/buildings',
  '/projects', '/neighborhoods', '/blog', '/advertise', '/favorites',
  '/add-listing', '/listing/vake-chavchavadze-47', '/settings', '/dashboard', '/admin',
]
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

mkdirSync(OUT, { recursive: true })

const server = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
  cwd: APP_DIR,
  stdio: ['ignore', 'pipe', 'pipe'],
})
server.stderr.on('data', (d) => process.stderr.write(d))

async function waitReady(timeoutMs = 120_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(BASE)
      if (r.status < 500) return
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('dev server did not start')
}

const slug = (r) => (r === '/' ? 'home' : r.replaceAll('/', '-').slice(1))

try {
  await waitReady()
  const browser = await chromium.launch()
  const failures = []
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    for (const route of ROUTES) {
      try {
        const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60_000 })
        await page.waitForTimeout(600)
        await page.screenshot({ path: `${OUT}/${vp.name}-${slug(route)}.png`, fullPage: false })
        console.log(`${vp.name} ${route} -> ${resp?.status()} (${page.url().replace(BASE, '')})`)
      } catch (e) {
        failures.push(`${vp.name} ${route}: ${e.message.split('\n')[0]}`)
      }
    }
    await page.close()
  }
  await browser.close()
  if (failures.length) {
    console.log('\nFAILURES:')
    failures.forEach((f) => console.log(' -', f))
  }
} finally {
  server.kill('SIGTERM')
}
