/**
 * SIVRCE — Building Score (0–100) with a transparent factor breakdown.
 * Composite of live signals; missing factors are skipped and weights
 * renormalized, so a thin building never gets a fabricated score.
 *
 * ponytail: heuristic weights (value/liquidity/trust/quality/location).
 * Reweight once sold-price data accumulates in MarketSnapshot.
 */

export interface BuildingScoreInput {
  /** Avg $/m² of sale listings in the building; null → score is null. */
  avgPerM2USD: number | null
  /** District percentile of that avg (5..95 from priceScaleOf) — low = cheap. */
  districtPct: number | null
  /** Active sale listings. */
  saleCount: number
  /** Verified share 0..1 across listings; null without listings. */
  verifiedShare: number | null
  /** Review rating 0..5; null without reviews. */
  rating: number | null
  /** Metro walk minutes; null when no metro nearby. */
  metroWalkMin: number | null
}

export type BuildingFactorKey = 'value' | 'liquidity' | 'trust' | 'quality' | 'location'

export interface BuildingScoreFactor {
  key: BuildingFactorKey
  pct: number
  weight: number
}

export interface BuildingScoreResult {
  score: number
  factors: BuildingScoreFactor[]
  /** Sample-based trust in the score itself. */
  confidence: 'low' | 'medium' | 'high'
}

const WEIGHTS: Record<BuildingFactorKey, number> = {
  value: 30,
  liquidity: 25,
  trust: 15,
  quality: 15,
  location: 15,
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Building Score 0–100, or null when the price sample is too thin to anchor it. */
export function buildingScoreOf(input: BuildingScoreInput): BuildingScoreResult | null {
  if (input.avgPerM2USD == null) return null
  const factors: BuildingScoreFactor[] = []

  // Value — cheaper vs district percentile scores higher.
  if (input.districtPct != null) {
    factors.push({ key: 'value', pct: Math.round(100 - clamp(input.districtPct, 5, 95)), weight: WEIGHTS.value })
  }
  // Liquidity — 4+ active sale listings ≈ saturated interest.
  factors.push({ key: 'liquidity', pct: clamp(input.saleCount * 25, 0, 100), weight: WEIGHTS.liquidity })
  // Trust — verified share.
  if (input.verifiedShare != null) {
    factors.push({ key: 'trust', pct: Math.round(clamp(input.verifiedShare * 100, 0, 100)), weight: WEIGHTS.trust })
  }
  // Quality — review rating (3.0/5 ≈ neutral 60 when unrated).
  factors.push({ key: 'quality', pct: input.rating != null ? Math.round(clamp((input.rating / 5) * 100, 0, 100)) : 60, weight: WEIGHTS.quality })
  // Location — metro walk time (no metro → neutral 60).
  factors.push({
    key: 'location',
    pct: input.metroWalkMin != null ? Math.round(clamp(100 - (input.metroWalkMin - 5) * 3.5, 30, 100)) : 60,
    weight: WEIGHTS.location,
  })

  const totalWeight = factors.reduce((a, f) => a + f.weight, 0)
  const score = Math.round(factors.reduce((a, f) => a + f.pct * f.weight, 0) / totalWeight)
  const confidence = input.saleCount >= 5 ? 'high' : input.saleCount >= 3 ? 'medium' : 'low'
  return { score, factors, confidence }
}
