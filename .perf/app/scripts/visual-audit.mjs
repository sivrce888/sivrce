// Sivrce visual audit v2 — viewport-scroll shots (real user simulation).
// Boots dev server once, shoots key pages at real scroll positions.
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const APP = new URL('..', import.meta.url).pathname
const PORT = 3212
const BASE = `http://localhost:${PORT}`
const OUT = `${APP}shots/`

const server = spawn('npm', ['run', 'dev', '--', '-p', String(PORT)], {
  cwd: APP, stdio: ['ignore', 'pipe', 'pipe'],
})
server.stderr.on('data', (d) => process.stderr.write(d))

async function waitReady() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(BASE, { redirect: 'manual' })
      if (r.status < 500) return
    } catch {}
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('dev server never became ready')
}

async function shootScroll(page, name, stops) {
  for (let s = 0; s < stops; s++) {
    await page.evaluate((i) => window.scrollTo({ top: i * 800, behavior: 'instant' }), s)
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}${name}-s${s}.png` })
  }
  console.log('shot', name)
}

try {
  await waitReady()
  const browser = await chromium.launch()
  const jobs = [
    { path: '/', theme: 'light', name: 'b1-home', w: 1440, h: 900, stops: 6 },
    { path: '/search', theme: 'light', name: 'b2-search', w: 1440, h: 900, stops: 2 },
    { path: '/', theme: 'light', name: 'b3-home-mob', w: 390, h: 844, stops: 8 },
    { path: '/search', theme: 'light', name: 'b4-search-mob', w: 390, h: 844, stops: 3 },
  ]
  for (const j of jobs) {
    const ctx = await browser.newContext({ viewport: { width: j.w, height: j.h } })
    await ctx.addInitScript((t) => window.localStorage.setItem('sivrce:theme', t), j.theme)
    const page = await ctx.newPage()
    await page.goto(`${BASE}${j.path}`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
    await page.waitForTimeout(3000)
    await shootScroll(page, j.name, j.stops)
    await ctx.close()
  }
  await browser.close()
} finally {
  server.kill('SIGTERM')
}
