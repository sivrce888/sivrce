/** Runnable check: npx tsx src/lib/market-stats.check.ts */
import assert from 'node:assert/strict'
import {
  medianOf,
  momDeltaPct,
  periodKey,
  statsFromRows,
  quarterKey,
  monthsOfQuarter,
  prevQuarterKey,
  quarterStats,
  weightedTotal,
  QUARTER_RE,
  normalizeQuarter,
  type StatRow,
} from "./market-stats-core"

const NOW = Date.parse("2026-09-15T12:00:00Z")

// periodKey
console.assert(periodKey(new Date(NOW)) === "2026-09", "periodKey month")
console.assert(periodKey(new Date(Date.UTC(2026, 0, 1))) === "2026-01", "periodKey zero-pad")

// medianOf
console.assert(medianOf([5, 1, 3]) === 3, "median odd")
console.assert(medianOf([4, 1, 2, 3]) === 3, "median even (rounded)")
console.assert(medianOf([]) === null && medianOf([0, -1]) === null, "median empty/garbage")

const row = (over: Partial<StatRow>): StatRow => ({
  pricePerSqm: 2000,
  currency: "USD",
  price: 100_000,
  createdAt: new Date(NOW - 10 * 86_400_000),
  ...over,
})

// statsFromRows — happy path: GEL normalization, month boundary, DOM.
// NOW = 2026-09-15 → NOW-10d = Sep 5 (in month), NOW-20d = Aug 26 (out).
const rows: StatRow[] = [
  row({}), // USD 2000/m², $100k, Sep 5
  row({ currency: "GEL", pricePerSqm: 5400, price: 270_000, createdAt: new Date(NOW - 20 * 86_400_000) }),
  row({ pricePerSqm: 2200, price: 120_000, createdAt: new Date(NOW - 2 * 86_400_000) }),
  // row without $/m² counts toward active/DOM but not the price sample
  row({ pricePerSqm: null, createdAt: new Date(NOW - 1 * 86_400_000) }),
]
const stats = statsFromRows(rows, 2.7, NOW)
console.assert(stats !== null, "stats present")
console.assert(stats!.sample === 3, "sample excludes perM2-less rows")
console.assert(stats!.activeCount === 4, "active counts all rows")
console.assert(stats!.newListings === 3, "new listings = rows created this month")
console.assert(stats!.avgPerM2USD === 2067, `avg perM2 incl. GEL→USD (got ${stats!.avgPerM2USD})`)
console.assert(stats!.medianPriceUSD === 100_000, `median price (got ${stats!.medianPriceUSD})`)
console.assert(stats!.avgDomDays === 8, `avg DOM (got ${stats!.avgDomDays})`)

// thin sample → null (page falls back to static price)
console.assert(statsFromRows(rows.slice(0, 2), 2.7, NOW) === null, "thin sample hides stats")
console.assert(statsFromRows([], 2.7, NOW) === null, "no rows → null")

// momDeltaPct
console.assert(momDeltaPct(2200, 2000) === 10, "mom +10%")
console.assert(momDeltaPct(1800, 2000) === -10, "mom −10%")
console.assert(momDeltaPct(2000, 2000) === null, "flat month → null")
console.assert(momDeltaPct(2200, null) === null, "no history → null")
console.assert(momDeltaPct(10_000, 100) === 99, "mom clamps at +99")


const assertEq = (a: unknown, b: unknown, label: string) => assert.deepEqual(a, b, label)

assert.equal(quarterKey(new Date('2026-09-26T12:00:00Z')), '2026-Q3', 'Sep → Q3')
assert.equal(quarterKey(new Date('2026-01-01T00:00:00Z')), '2026-Q1', 'Jan → Q1')
assert.equal(quarterKey(new Date('2026-12-31T23:00:00Z')), '2026-Q4', 'Dec → Q4')

assertEq(monthsOfQuarter('2026-Q3'), ['2026-07', '2026-08', '2026-09'], 'Q3 months')
assertEq(monthsOfQuarter('2026-Q1'), ['2026-01', '2026-02', '2026-03'], 'Q1 months')
assertEq(monthsOfQuarter('2026-Q4'), ['2026-10', '2026-11', '2026-12'], 'Q4 months')
assertEq(monthsOfQuarter('bogus'), [], 'malformed quarter → no months')

assert.equal(prevQuarterKey('2026-Q3'), '2026-Q2', 'mid-year prev')
assert.equal(prevQuarterKey('2026-Q1'), '2025-Q4', 'year rollover')
assert.equal(prevQuarterKey('x'), null, 'malformed → null')

assert.ok(QUARTER_RE.test('2026-Q3'), 'valid format')
assert.ok(!QUARTER_RE.test('2026-Q5'), 'Q5 invalid')
assert.ok(!QUARTER_RE.test('2026-Q0'), 'Q0 invalid')

const qrow = (periodMonth: string, avgPricePerSqm: number, over: Partial<{ medianPrice: number | null; soldCount: number; avgDaysOnMarket: number; newListingsCount: number; activeListingsCount: number }> = {}) => ({
  periodMonth, avgPricePerSqm, medianPrice: null, soldCount: 0, avgDaysOnMarket: 40,
  newListingsCount: 0, activeListingsCount: 10, ...over,
})

const qs = quarterStats([
  qrow('2026-07', 1000, { medianPrice: 90_000, soldCount: 2, activeListingsCount: 30 }),
  qrow('2026-08', 1100, { medianPrice: 100_000, soldCount: 1, activeListingsCount: 20 }),
  qrow('2026-09', 1200, { medianPrice: 110_000, soldCount: 3, newListingsCount: 5, activeListingsCount: 10 }),
])
assert.ok(qs, 'three months aggregate')
assert.equal(qs!.months, 3, 'months present')
assert.equal(qs!.avgPerM2USD, 1100, 'mean of monthly avgs')
assert.equal(qs!.medianPriceUSD, 100_000, 'median across monthly medians')
assert.equal(qs!.soldCount, 6, 'sold sums')
assert.equal(qs!.newListings, 5, 'new sums')
assert.equal(qs!.activeEnd, 10, 'active = latest month present')
assert.equal(qs!.avgDomDays, 40, 'dom means')

assert.equal(quarterStats([]), null, 'no rows → null')
assert.equal(quarterStats([qrow('2026-07', 0)]), null, 'unpriced months → null')

assert.equal(weightedTotal([{ avgPerM2USD: 1000, activeEnd: 10 }, { avgPerM2USD: 2000, activeEnd: 30 }]), 1750, 'active-weighted mean')
assert.equal(weightedTotal([{ avgPerM2USD: 1000, activeEnd: 0 }]), null, 'no weight → null')


assert.equal(normalizeQuarter('2026-q3'), '2026-Q3', 'lowercase URL quarter normalizes')
assert.equal(normalizeQuarter('2026-Q3'), '2026-Q3', 'canonical form idempotent')
assert.equal(normalizeQuarter('2026-q5'), null, 'Q5 garbage')
assert.equal(normalizeQuarter('x'), null, 'garbage')

console.log("market-stats: ok")
