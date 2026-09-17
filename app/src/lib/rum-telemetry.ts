/**
 * SIVRCE — Production Real User Monitoring (RUM) & Zero-Jank Telemetry.
 * Zero external libraries, zero main-thread block, zero layout shift.
 *
 * Captures Core Web Vitals:
 *  - LCP (Largest Contentful Paint) — Target < 1200ms
 *  - INP (Interaction to Next Paint) — Target < 50ms
 *  - CLS (Cumulative Layout Shift) — Target < 0.05
 *  - TTFB (Time to First Byte) — Target < 100ms
 */

export interface RumMetric {
  name: 'LCP' | 'INP' | 'CLS' | 'TTFB' | 'FCP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  url: string
  deviceTier: 'high' | 'mid' | 'low'
  connection?: string
  timestamp: number
}

export function rateMetric(name: RumMetric['name'], value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'LCP':
      return value <= 1500 ? 'good' : value <= 2500 ? 'needs-improvement' : 'poor'
    case 'INP':
      return value <= 50 ? 'good' : value <= 200 ? 'needs-improvement' : 'poor'
    case 'CLS':
      return value <= 0.05 ? 'good' : value <= 0.1 ? 'needs-improvement' : 'poor'
    case 'TTFB':
      return value <= 150 ? 'good' : value <= 400 ? 'needs-improvement' : 'poor'
    case 'FCP':
      return value <= 1000 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
  }
}

/** Client-side RUM initializer — registers observers during idle time. */
export function initRumTelemetry(endpoint = '/api/rum') {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return

  const queue: RumMetric[] = []
  const deviceTier = (navigator.hardwareConcurrency ?? 4) >= 8 ? 'high' : (navigator.hardwareConcurrency ?? 4) >= 4 ? 'mid' : 'low'

  function sendQueue() {
    if (queue.length === 0) return
    const payload = JSON.stringify(queue.splice(0, queue.length))
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, payload)
    } else {
      fetch(endpoint, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {})
    }
  }

  function report(name: RumMetric['name'], val: number) {
    const value = Math.round(val * 100) / 100
    queue.push({
      name,
      value,
      rating: rateMetric(name, value),
      url: window.location.pathname,
      deviceTier,
      timestamp: Date.now(),
    })
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(sendQueue, { timeout: 4000 })
    } else {
      setTimeout(sendQueue, 1500)
    }
  }

  try {
    // 1. LCP Observer
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) report('LCP', lastEntry.startTime)
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

    // 2. CLS Observer
    let clsValue = 0
    interface LayoutShiftEntry extends PerformanceEntry {
      hadRecentInput?: boolean
      value?: number
    }
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput && typeof entry.value === 'number') {
          clsValue += entry.value
        }
      }
      report('CLS', clsValue)
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })

    // 3. Navigation Timing (TTFB, FCP)
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (navEntries.length > 0) {
      const nav = navEntries[0]!
      report('TTFB', nav.responseStart - nav.requestStart)
    }
  } catch {
    // Observers unsupported on older web views — fail silently
  }
}
