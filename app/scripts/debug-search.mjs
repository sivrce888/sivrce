import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const APP = new URL('..', import.meta.url).pathname
const PORT = 3213
const BASE = `http://localhost:${PORT}`

const server = spawn('npm', ['run', 'dev', '--', '-p', String(PORT)], { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] })
server.stderr.on('data', (d) => process.stderr.write(d))

async function waitReady() {
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(BASE, { redirect: 'manual' }); if (r.status < 500) return } catch {}
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('not ready')
}

try {
  await waitReady()
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message))
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0, 300)) })
  const res = await page.goto(`${BASE}/search`, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch((e) => { console.log('GOTO FAIL', e.message); return null })
  console.log('STATUS', res?.status())
  await page.waitForTimeout(6000)
  const html = await page.evaluate(() => document.body.innerText.slice(0, 400))
  console.log('BODY TEXT:', JSON.stringify(html))
  await page.screenshot({ path: `${APP}shots/debug-search-mob.png` })
  await browser.close()
} finally {
  server.kill('SIGTERM')
}
