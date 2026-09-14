import assert from 'node:assert/strict'
import { calculateValuation10x } from './valuation-10x'

console.log('valuation-10x.check: starting assertions...')

const report = calculateValuation10x({
  priceUSD: 100000,
  areaSqm: 60,
  monthlyRentUSD: 800,
  countryCode: 'GE',
  downPaymentPct: 20,
  mortgageInterestRatePct: 7.5,
  mortgageTermYears: 20,
})

assert.equal(report.pricePerSqmUSD, 1667)
assert.equal(report.grossYieldPct, 9.6)
assert.ok(report.netCapRatePct > 0 && report.netCapRatePct < report.grossYieldPct)
assert.ok(report.scenarios.base.year5PropertyValueUSD > 100000)
assert.ok(report.scenarios.bull.year5IrrPct > report.scenarios.bear.year5IrrPct)
assert.ok(report.recommendations.whyBuyEn.length > 0)
assert.ok(report.recommendations.whyBuyKa.length > 0)
assert.ok(report.recommendations.risksEn.length > 0)
assert.ok(report.recommendations.risksKa.length > 0)

// Check DE specific closing costs
const reportDE = calculateValuation10x({
  priceUSD: 400000,
  areaSqm: 80,
  monthlyRentUSD: 1800,
  countryCode: 'DE',
})
assert.equal(reportDE.estimatedClosingCostsUSD, 32000)

console.log('valuation-10x.check: all assertions passed ✓')
