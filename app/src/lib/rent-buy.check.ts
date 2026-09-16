/**
 * Runnable check: npx tsx src/lib/rent-buy.check.ts
 * Rent-vs-buy model — wealth accounting identities, monotonicity, break-even.
 */
import assert from 'node:assert/strict'
import { rentVsBuy, type RentBuyInput } from './rent-buy'
import { monthlyPayment } from './finance'

const ZERO_COSTS = {
  rentInflationPct: 0,
  appreciationPct: 0,
  altReturnPct: 0,
  buyCostsPct: 0,
  sellCostsPct: 0,
  ownershipCostsPct: 0,
}

// ——— identity: with every growth/cost at zero, owning ends with exactly the house ———
const flat: RentBuyInput = {
  price: 100_000, downPct: 20, ratePct: 6, mortgageYears: 10, horizonYears: 10,
  rentMonthly: 500, ...ZERO_COSTS,
}
const flatOut = rentVsBuy(flat)
assert.ok(Math.abs(flatOut.buyNetWorth - 100_000) < 0.01, 'flat: owner ends with the home, debt-free')
const pi = monthlyPayment(80_000, 6, 10)
assert.ok(Math.abs(flatOut.ownFirstMonth - pi) < 0.01, 'flat: first-month cost is the mortgage payment')
// renter keeps the 20k down payment + invests the monthly surplus (888.16 − 500) × 120
assert.ok(Math.abs(flatOut.rentNetWorth - (20_000 + (pi - 500) * 120)) < 0.5, 'flat: renter pots down payment + surplus')
assert.equal(flatOut.delta, flatOut.buyNetWorth - flatOut.rentNetWorth, 'delta consistency')

// ——— monotonicity: higher appreciation or higher rent favors buying ———
const base: RentBuyInput = {
  price: 120_000, downPct: 25, ratePct: 10, mortgageYears: 20, horizonYears: 10,
  rentMonthly: 850, rentInflationPct: 5, appreciationPct: 4, altReturnPct: 7,
  buyCostsPct: 2.5, sellCostsPct: 2, ownershipCostsPct: 0.8,
}
const d0 = rentVsBuy(base).delta
const dApp = rentVsBuy({ ...base, appreciationPct: 8 }).delta
const dRent = rentVsBuy({ ...base, rentMonthly: 1_200 }).delta
assert.ok(dApp > d0, 'more appreciation → buying more favorable')
assert.ok(dRent > d0, 'higher rent → buying more favorable')

// ——— Georgian defaults break even within the 10-year horizon ———
const def = rentVsBuy(base)
assert.ok(def.breakEvenYear !== null && def.breakEvenYear >= 1 && def.breakEvenYear <= 10, 'defaults: break-even within horizon')

// ——— crashing market + cheap rent can flip the verdict ———
const crash = rentVsBuy({ ...base, appreciationPct: 0, rentMonthly: 400, altReturnPct: 10 })
assert.ok(!crash.buyWins, 'flat prices + cheap rent + strong deposits → renting wins')

// ——— horizon shorter than the loan term still returns sane numbers ———
const short = rentVsBuy({ ...base, horizonYears: 2 })
assert.ok(Number.isFinite(short.buyNetWorth) && Number.isFinite(short.rentNetWorth), 'short horizon finite')

console.log('rent-buy.check: OK ✓')
