/**
 * Market price-scale position (MyHome „ღირებულების შკალა").
 * ponytail: percentile vs peer $/m² — MarketSnapshot when inventory is dense.
 */

export type PriceScaleBand =
  | "low"
  | "mediumLow"
  | "average"
  | "aboveAverage"
  | "high"

export interface PriceScaleResult {
  /** 0–100 marker position on the bar */
  pct: number
  band: PriceScaleBand
  labelKa: string
}

const LABELS: Record<PriceScaleBand, string> = {
  low: "დაბალი ფასი",
  mediumLow: "საშუალოზე დაბალი",
  average: "საშუალო ფასი",
  aboveAverage: "საშუალოზე მაღალი",
  high: "მაღალი ფასი",
}

function bandOf(pct: number): PriceScaleBand {
  if (pct < 20) return "low"
  if (pct < 40) return "mediumLow"
  if (pct < 60) return "average"
  if (pct < 80) return "aboveAverage"
  return "high"
}

/** Percentile of `value` among `peers` (inclusive). Empty peers → mid. */
export function priceScaleOf(value: number, peers: number[]): PriceScaleResult {
  if (!Number.isFinite(value) || value <= 0) {
    return { pct: 50, band: "average", labelKa: LABELS.average }
  }
  const clean = peers.filter((p) => Number.isFinite(p) && p > 0)
  if (clean.length < 2) {
    return { pct: 50, band: "average", labelKa: LABELS.average }
  }
  const below = clean.filter((p) => p < value).length
  const pct = Math.round((below / clean.length) * 100)
  const clamped = Math.min(95, Math.max(5, pct))
  const band = bandOf(clamped)
  return { pct: clamped, band, labelKa: LABELS[band] }
}

export type FairPriceResult = {
  sample: number
  rangeMin: number
  rangeMax: number
  /** % above max / below min; 0 if inside the range. */
  deltaPct: number
  position: 'below' | 'in' | 'above'
}

function percentile(sorted: number[], p: number): number {
  const i = (sorted.length - 1) * p
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  const a = sorted[lo]!
  const b = sorted[hi]!
  return lo === hi ? a : a + (b - a) * (i - lo)
}

/** Asking vs p25–p75 of peer $/m² × area. Null when the sample is too thin to show. */
export function fairPriceOf(
  askingUsd: number,
  area: number,
  peerPerM2: number[],
  minSample = 5,
): FairPriceResult | null {
  if (!(askingUsd > 0) || !(area > 0)) return null
  const clean = peerPerM2.filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b)
  if (clean.length < minSample) return null
  const rangeMin = Math.round(percentile(clean, 0.25) * area)
  const rangeMax = Math.round(percentile(clean, 0.75) * area)
  if (!(rangeMin > 0) || rangeMax < rangeMin) return null
  if (askingUsd > rangeMax) {
    return {
      sample: clean.length,
      rangeMin,
      rangeMax,
      deltaPct: Math.round(((askingUsd - rangeMax) / rangeMax) * 100),
      position: 'above',
    }
  }
  if (askingUsd < rangeMin) {
    return {
      sample: clean.length,
      rangeMin,
      rangeMax,
      deltaPct: Math.round(((rangeMin - askingUsd) / rangeMin) * 100),
      position: 'below',
    }
  }
  return { sample: clean.length, rangeMin, rangeMax, deltaPct: 0, position: 'in' }
}
