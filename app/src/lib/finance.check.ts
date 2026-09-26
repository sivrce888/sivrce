import assert from 'node:assert/strict'
import {
  monthlyPayment,
  amortizationSchedule,
  grossYieldPct,
  dtiPct,
} from './finance'
import { estimateRent, rentPerSqm } from './rent-anchor'

// 1. Standard Annuity Monthly Payment
const p100k = monthlyPayment(100_000, 10, 20)
assert.ok(p100k > 950 && p100k < 970, `Expected ~965, got ${p100k}`)
assert.equal(monthlyPayment(0, 10, 20), 0)
assert.equal(monthlyPayment(100_000, 0, 20), 100_000 / (20 * 12))

// 2. Amortization Schedule
const sched = amortizationSchedule(100_000, 10, 20)
assert.equal(sched.length, 20)
assert.equal(sched[19].remainingBalance, 0)
assert.ok(sched[19].totalPrincipalPaid >= 99_990)
assert.ok(sched[19].totalInterestPaid > 100_000)

// 3. Yield
assert.equal(grossYieldPct(100_000, 500), 6)

// 4. DTI pre-check
assert.ok(Math.abs(dtiPct(1000, 0, 3000)! - 33.3) < 0.1)
assert.equal(dtiPct(1000, 500, 3000), 50)
assert.equal(dtiPct(1000, 0, 0), null)

// 5. Rent anchors (lib/rent-anchor) — district beats city, unknown markets stay silent.
assert.equal(rentPerSqm('GE', 'თბილისი', 'ვაკე'), 13.8, 'Vake district anchor')
assert.equal(rentPerSqm(undefined, 'Tbilisi', 'Didube'), 10, 'unknown district → Tbilisi avg; missing country = GE')
assert.equal(rentPerSqm('GE', 'ბათუმი', null), null, 'no sourced Batumi anchor → silent')
assert.equal(rentPerSqm('FR', 'Paris'), null, 'unlaunched anchor → silent')
assert.ok((rentPerSqm('DE', 'berlin') ?? 0) > 0 && rentPerSqm('DE', 'Berlin') === rentPerSqm('DE', 'berlin'), 'DE city by slug or name')
assert.equal(estimateRent(0, 'GE', 'თბილისი'), null, 'no area → no rent')
assert.equal(estimateRent(60, 'GE', 'თბილისი', 'ვაკე'), 830, '60 m² × 13.8 → 828 → 830')

// The bug this replaced: price × 0.5% made every listing yield 6%. Cheaper $/m² must yield more.
const rent = estimateRent(60, 'GE', 'თბილისი', 'საბურთალო')!
assert.ok(grossYieldPct(80_000, rent) > grossYieldPct(140_000, rent), 'yield tracks price per m²')

console.log('finance.check: ok — annuity, amort, yield, dti, rent anchors')
