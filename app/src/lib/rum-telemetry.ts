/**
 * SIVRCE — Real User Monitoring (RUM) field Core Web Vitals.
 * Zero external libraries, zero main-thread block, zero layout shift.
 *
 * Captures:
 *  - LCP (Largest Contentful Paint) — Target < 1200ms
 *  - CLS (Cumulative Layout Shift) — Target < 0.05
 *  - TTFB (Time to First Byte) — Target < 100ms
 *
 * Delivery is NOT this module's job: it hands each metric to `send`, which
 * PostHogProvider wires to the consent-gated analytics transport. There is no
 * own endpoint on purpose — a beacon route would cost one Vercel invocation
 * per pageview and would fire before the TDDDG §25 consent gate.
 */

export interface RumMetric {
  name: 'LCP' | 'INP' | 'CLS' | 'TTFB' | 'FCP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  url: string
  deviceTier: 'high' | 'mid' | 'low'
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

/**
 * Registers the observers and reports every metric through `send`.
 *
 * `buffered: true` replays entries recorded before this ran, so arming late
 * (the consent gate boots analytics on the first interaction) still yields
 * the real field values rather than a truncated sample.
 */
export function initRumTelemetry(send: (metric: RumMetric) => void): void {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return

  const cores = navigator.hardwareConcurrency ?? 4
  const deviceTier = cores >= 8 ? 'high' : cores >= 4 ? 'mid' : 'low'

  function report(name: RumMetric['name'], val: number) {
    const value = Math.round(val * 100) / 100
    send({
      name,
      value,
      rating: rateMetric(name, value),
      url: window.location.pathname,
      deviceTier,
      timestamp: Date.now(),
    })
  }

  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) report('LCP', lastEntry.startTime)
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })

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

    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (navEntries.length > 0) {
      const nav = navEntries[0]!
      report('TTFB', nav.responseStart - nav.requestStart)
    }
  } catch {
    // Observers unsupported on older web views — fail silently
  }
}
