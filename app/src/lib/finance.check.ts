import assert from 'node:assert/strict'
import {
  monthlyPayment,
  differentiatedPayment,
  amortizationSchedule,
  transferTaxGEL,
  estimateMonthlyRent,
  grossYieldPct,
  validateLtv,
  dtiPct,
  GEORGIAN_BANKS,
} from './finance'

// 1. Standard Annuity Monthly Payment
const p100k = monthlyPayment(100_000, 10, 20)
assert.ok(p100k > 950 && p100k < 970, `Expected ~965, got ${p100k}`)
assert.equal(monthlyPayment(0, 10, 20), 0)
assert.equal(monthlyPayment(100_000, 0, 20), 100_000 / (20 * 12))

// 2. Differentiated Payment
const diffM1 = differentiatedPayment(100_000, 10, 20, 1)
const diffM240 = differentiatedPayment(100_000, 10, 20, 240)
assert.ok(diffM1 > diffM240, 'First month payment must be greater than last month payment in differentiated loan')
assert.ok(diffM1 > 1200 && diffM1 < 1300, `Expected ~1250, got ${diffM1}`)
assert.ok(diffM240 > 400 && diffM240 < 500, `Expected ~420, got ${diffM240}`)

// 3. Amortization Schedule
const sched = amortizationSchedule(100_000, 10, 20)
assert.equal(sched.length, 20)
assert.equal(sched[19].remainingBalance, 0)
assert.ok(sched[19].totalPrincipalPaid >= 99_990)
assert.ok(sched[19].totalInterestPaid > 100_000)

// 4. LTV Validation (NBG regulations)
const resCompliant = validateLtv(20, true)
assert.equal(resCompliant.valid, true)
assert.equal(resCompliant.currentLtvPct, 80)

const resNonCompliant = validateLtv(10, true)
assert.equal(resNonCompliant.valid, false)

const nonResCompliant = validateLtv(35, false)
assert.equal(nonResCompliant.valid, true)

const nonResNonCompliant = validateLtv(20, false)
assert.equal(nonResNonCompliant.valid, false)

// 5. Transfer Tax & Rent heuristics
assert.equal(transferTaxGEL(50_000), 500)
assert.equal(transferTaxGEL(150_000), 1_000 + 1_000)
assert.equal(estimateMonthlyRent(100_000), 500)
assert.equal(grossYieldPct(100_000, 500), 6)

// 6. Georgian Banks
assert.ok(GEORGIAN_BANKS.length >= 4)
for (const b of GEORGIAN_BANKS) {
  assert.ok(b.gelRate > 0 && b.gelRate < 25)
  assert.ok(b.usdRate > 0 && b.usdRate < 20)
  assert.ok(b.maxYears >= 15)
}

// 7. DTI pre-check
assert.ok(Math.abs(dtiPct(1000, 0, 3000)! - 33.3) < 0.1)
assert.equal(dtiPct(1000, 500, 3000), 50)
assert.equal(dtiPct(1000, 0, 0), null)

console.log('finance.check: ok — annuity, diff, amort, LTV, tax, yield, banks, dti')
