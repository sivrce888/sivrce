/** Runnable check: npx tsx src/lib/building-score.check.ts */
import { buildingScoreOf } from "./building-score"

const base = {
  avgPerM2USD: 2400,
  districtPct: 30,
  saleCount: 6,
  verifiedShare: 0.8,
  rating: 4.5,
  metroWalkMin: 7,
}

const full = buildingScoreOf(base)
console.assert(full !== null, "score present with sample")
// value: 100-30=70 · liquidity: 6*25→100 · trust: 80 · quality: 90 · location: 100-7=93
// score = (70*30 + 100*25 + 80*15 + 90*15 + 93*15) / 100 = 85.45 → 85
console.assert(full!.score === 85, `full score (got ${full?.score})`)
console.assert(full!.factors.length === 5, "all factors present")
console.assert(full!.confidence === "high", "high confidence at 6 sales")

// cheap building scores high on value
const cheap = buildingScoreOf({ ...base, districtPct: 10, saleCount: 5 })
console.assert(cheap!.factors.find((f) => f.key === "value")!.pct === 90, "cheap → high value pct")

// missing factors renormalize instead of fabricating
const thin = buildingScoreOf({ ...base, districtPct: null, verifiedShare: null, saleCount: 1 })
console.assert(thin!.factors.length === 3, "skipped factors dropped")
console.assert(thin!.confidence === "low", "low confidence at 1 sale")
// liquidity 25 · quality 90 · location 93 → (25*25 + 90*15 + 93*15) / 55 = 61.27 → 61
console.assert(thin!.score === 61, `renormalized score (got ${thin?.score})`)

// no price sample → no score (module hidden entirely)
console.assert(buildingScoreOf({ ...base, avgPerM2USD: null }) === null, "null without price sample")

console.log("building-score: ok")
