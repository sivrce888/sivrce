/** Runnable check: npx tsx src/lib/market-stats.check.ts */
import {
  medianOf,
  momDeltaPct,
  periodKey,
  statsFromRows,
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

console.log("market-stats: ok")
