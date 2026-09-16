/**
 * Runnable check: npx tsx src/lib/countries/de-rent-buy.check.ts
 * German rent-vs-buy wiring — statutory closing costs feed the model honestly.
 */
import assert from 'node:assert/strict'
import { deBuyCostsPct, deRentVsBuy, DE_RENT_BUY_STATES, DE_FIXED_ASSUMPTIONS } from './de-rent-buy'
import { rentVsBuy } from '../rent-buy'
import { GRUNDERWERBSTEUER_BY_STATE } from './de'

// ——— statutory engine feeds the model: Berlin 500k → 6% GrESt + 1.5 + 0.5 + 3.57 = 11.57% ———
const berlin = deBuyCostsPct(500_000)
assert.equal(berlin.transferTaxPct, 6, 'Berlin Grunderwerbsteuer 6%')
assert.equal(berlin.totalEur, 57_850, 'Berlin closing costs 57.850 €')
assert.ok(Math.abs(berlin.pct - 11.57) < 0.01, 'Berlin buy costs 11.57% of price')

// ——— states differ through GrESt only: Bayern (3.5%) cheaper than Berlin (6%) ———
const bayern = deBuyCostsPct(500_000, 'Bayern')
assert.equal(bayern.transferTaxPct, GRUNDERWERBSTEUER_BY_STATE.Bayern, 'Bayern GrESt from de.ts table')
assert.ok(bayern.pct < berlin.pct, 'Bayern cheaper to buy than Berlin')
assert.equal(DE_RENT_BUY_STATES.length, 16, 'all 16 Bundesländer exposed')

// ——— deRentVsBuy is exactly rentVsBuy with the DE fixed assumptions ———
const input = {
  price: 500_000, downPct: 20, ratePct: 3.5, horizonYears: 10,
  rentMonthly: 1_400, appreciationPct: 3, altReturnPct: 3, buyCostsPct: berlin.pct,
}
const wired = deRentVsBuy(input)
const manual = rentVsBuy({ ...input, mortgageYears: 30, ...DE_FIXED_ASSUMPTIONS })
for (const k of ['ownFirstMonth', 'rentFirstMonth', 'buyNetWorth', 'rentNetWorth', 'delta'] as const) {
  assert.ok(Math.abs(wired[k] - manual[k]) < 1e-9, `wiring passthrough: ${k}`)
}

// ——— German defaults behave: finite, first-month own cost sane, monotonic in appreciation ———
assert.ok(Number.isFinite(wired.buyNetWorth) && Number.isFinite(wired.rentNetWorth), 'finite results')
assert.ok(wired.ownFirstMonth > 0 && wired.rentFirstMonth === 1_400, 'monthly costs sane')
const moreGrowth = deRentVsBuy({ ...input, appreciationPct: 5 })
assert.ok(moreGrowth.delta > wired.delta, 'more appreciation → buying more favorable')

// ——— the 11.57% Nebenkosten hurdle is real: flat prices + cheap rent → renting wins ———
const flatMarket = deRentVsBuy({ ...input, appreciationPct: 0, altReturnPct: 4 })
assert.ok(!flatMarket.buyWins, 'flat prices + solid deposits → Nebenkosten hurdle keeps renting ahead')

console.log('de-rent-buy.check: OK ✓ — statutory Kaufnebenkosten wired into rentVsBuy')
