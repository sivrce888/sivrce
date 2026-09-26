import assert from 'node:assert/strict'
import {
  monthlyPayment,
  amortizationSchedule,
  estimateMonthlyRent,
  grossYieldPct,
  dtiPct,
} from './finance'

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

// 3. Rent heuristics
assert.equal(estimateMonthlyRent(100_000), 500)
assert.equal(grossYieldPct(100_000, 500), 6)

// 4. DTI pre-check
assert.ok(Math.abs(dtiPct(1000, 0, 3000)! - 33.3) < 0.1)
assert.equal(dtiPct(1000, 500, 3000), 50)
assert.equal(dtiPct(1000, 0, 0), null)

console.log('finance.check: ok — annuity, amort, yield, dti')
