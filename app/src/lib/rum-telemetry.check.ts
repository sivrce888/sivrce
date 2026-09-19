import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { rateMetric } from './rum-telemetry'

const src = (p: string) => readFileSync(path.resolve(import.meta.dirname, p), 'utf8')

assert.equal(rateMetric('LCP', 1100), 'good')
assert.equal(rateMetric('LCP', 2200), 'needs-improvement')
assert.equal(rateMetric('LCP', 3500), 'poor')

assert.equal(rateMetric('INP', 40), 'good')
assert.equal(rateMetric('INP', 120), 'needs-improvement')
assert.equal(rateMetric('INP', 300), 'poor')

assert.equal(rateMetric('CLS', 0.02), 'good')
assert.equal(rateMetric('CLS', 0.08), 'needs-improvement')
assert.equal(rateMetric('CLS', 0.25), 'poor')

assert.equal(rateMetric('TTFB', 80), 'good')
assert.equal(rateMetric('TTFB', 250), 'needs-improvement')
assert.equal(rateMetric('TTFB', 800), 'poor')

// The old beacon POSTed every metric to /api/rum — a route that never existed.
// Result: a 404 plus a wasted request on every pageview, no metric ever
// collected, and it fired ahead of the TDDDG §25 consent gate. Delivery now
// rides the consent-gated PostHog transport; this module must stay transport-free.
const telemetry = src('rum-telemetry.ts')
assert.ok(
  !/sendBeacon|fetch\(|\/api\/rum/.test(telemetry),
  'rum-telemetry must not own a transport — delivery belongs to the consent gate',
)

const provider = src('../components/PostHogProvider.tsx')
assert.ok(
  provider.includes('initRumTelemetry'),
  'RUM must mount inside PostHogProvider so consent gates it',
)
assert.ok(
  !existsSync(path.resolve(import.meta.dirname, '../components/RumBeacon.tsx')),
  'the ungated RumBeacon must stay deleted — it bypassed the consent gate',
)

console.log('rum-telemetry.check: ok ✓')
