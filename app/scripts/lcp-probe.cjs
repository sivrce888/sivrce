/* Probe real LCP + main-thread timeline on the prod server. */
const { chromium } = require('playwright-core')

;(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.addInitScript(() => {
    window.__probe = { lcp: [], longtasks: [], paints: [] }
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__probe.lcp.push({ t: e.startTime, size: e.size, el: e.element?.tagName + '.' + (e.element?.className || '').toString().slice(0, 60) })
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__probe.longtasks.push({ t: e.startTime, d: e.duration })
    }).observe({ type: 'longtask', buffered: true })
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__probe.paints.push({ n: e.name, t: e.startTime })
    }).observe({ type: 'paint', buffered: true })
  })
  await page.goto('http://localhost:3100/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(6000)
  const probe = await page.evaluate(() => window.__probe)
  const resources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((r) => ({ n: r.name.split('/').pop().slice(0, 50), s: Math.round(r.startTime), e: Math.round(r.responseEnd), d: Math.round(r.duration) })).sort((a, b) => b.d - a.d).slice(0, 10),
  )
  console.log('LCP entries:', JSON.stringify(probe.lcp, null, 1))
  console.log('paints:', JSON.stringify(probe.paints))
  console.log('longtasks:', JSON.stringify(probe.longtasks))
  console.log('slowest resources:', JSON.stringify(resources, null, 1))
  await browser.close()
})()
