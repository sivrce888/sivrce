import assert from 'node:assert/strict'
import { rateMetric } from './rum-telemetry'

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

console.log('rum-telemetry.check: ok ✓')
