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
