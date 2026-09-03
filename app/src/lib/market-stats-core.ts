/**
 * SIVRCE — pure market-stats math (no DB import → safe for check files,
 * client bundles and edge runtimes). DB access lives in market-stats.ts.
 */

export interface StatRow {
  pricePerSqm: number | null
  currency: string
  price: number
  createdAt: Date
}

export interface DistrictStats {
  /** Rows with a usable $/m² — the sample behind avgPerM2USD. */
  sample: number
  activeCount: number
  newListings: number
  avgPerM2USD: number
  medianPriceUSD: number | null
  avgDomDays: number
}

/** Below this usable $/m² sample the section hides (page falls back to static). */
export const MIN_SAMPLE = 3

/** 'YYYY-MM' (UTC) — matches MarketSnapshot.periodMonth. */
export function periodKey(d: Date): string {
  return d.toISOString().slice(0, 7)
}

export function medianOf(nums: number[]): number | null {
  const clean = nums.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b)
  if (!clean.length) return null
  const mid = Math.floor(clean.length / 2)
  return clean.length % 2 ? clean[mid]! : Math.round((clean[mid - 1]! + clean[mid]!) / 2)
}

/** USD-normalized $/m² (same units as the district peer sample). */
function perM2USD(r: StatRow, usdGel: number): number | null {
  if (!r.pricePerSqm || r.pricePerSqm <= 0) return null
  const rate = usdGel > 0 ? usdGel : 2.7
  return r.currency === "USD" ? r.pricePerSqm : Math.round(r.pricePerSqm / rate)
}

function priceUSD(r: StatRow, usdGel: number): number | null {
  if (!(r.price > 0)) return null
  const rate = usdGel > 0 ? usdGel : 2.7
  return r.currency === "USD" ? r.price : Math.round(r.price / rate)
}

/** Aggregate raw listing rows into display stats. Null below MIN_SAMPLE. */
export function statsFromRows(
  rows: StatRow[],
  usdGel: number,
  now: number = Date.now(),
): DistrictStats | null {
  const perM2 = rows
    .map((r) => perM2USD(r, usdGel))
    .filter((v): v is number => v !== null)
  if (perM2.length < MIN_SAMPLE) return null
  const prices = rows
    .map((r) => priceUSD(r, usdGel))
    .filter((v): v is number => v !== null)
  const monthStart = `${periodKey(new Date(now))}-01T00:00:00Z`
  const doms = rows
    .map((r) => (now - r.createdAt.getTime()) / 86_400_000)
    .filter((d) => Number.isFinite(d) && d >= 0)
  const avg = perM2.reduce((a, b) => a + b, 0) / perM2.length
  return {
    sample: perM2.length,
    activeCount: rows.length,
    newListings: rows.filter((r) => r.createdAt >= new Date(monthStart)).length,
    avgPerM2USD: Math.round(avg),
    medianPriceUSD: medianOf(prices),
    avgDomDays: doms.length
      ? Math.round(doms.reduce((a, b) => a + b, 0) / doms.length)
      : 0,
  }
}

/** MoM delta % of avg $/m²; null without history or on a flat month. */
export function momDeltaPct(current: number, previous: number | null | undefined): number | null {
  if (!current || !previous || previous <= 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return null
  return Math.max(-99, Math.min(99, pct))
}
