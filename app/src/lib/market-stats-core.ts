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

// ---- Quarterly report editions (/market/2026-Q3) — snapshot aggregates ----

export interface QuarterSnapshotRow {
  periodMonth: string
  avgPricePerSqm: number
  medianPrice: number | null
  soldCount: number
  avgDaysOnMarket: number
  newListingsCount: number
  activeListingsCount: number
}

export const QUARTER_RE = /^\d{4}-Q[1-4]$/

/** Accept any-case quarter ('2026-q3' — the URL middleware lowercases paths)
 *  → canonical '2026-Q3', or null for garbage. */
export function normalizeQuarter(raw: string): string | null {
  const m = /^(\d{4})-q([1-4])$/i.exec(raw.trim())
  return m ? `${m[1]}-Q${m[2]}` : null
}

/** '2026-Q3' for a UTC date. */
export function quarterKey(d: Date): string {
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`
}

/** The quarter's three 'YYYY-MM' period keys, or [] for a malformed quarter. */
export function monthsOfQuarter(quarter: string): string[] {
  const m = QUARTER_RE.exec(quarter)
  if (!m) return []
  const y = Number(quarter.slice(0, 4))
  const qi = Number(quarter.slice(6))
  return [1, 2, 3].map((i) => `${y}-${String((qi - 1) * 3 + i).padStart(2, '0')}`)
}

export function prevQuarterKey(quarter: string): string | null {
  if (!QUARTER_RE.test(quarter)) return null
  let y = Number(quarter.slice(0, 4))
  let qi = Number(quarter.slice(6)) - 1
  if (qi === 0) { y -= 1; qi = 4 }
  return `${y}-Q${qi}`
}

export interface QuarterStats {
  /** Snapshot months actually present (a live quarter has fewer than 3). */
  months: number
  avgPerM2USD: number
  medianPriceUSD: number | null
  soldCount: number
  newListings: number
  /** Active listings in the latest month present — caller sorts rows by periodMonth. */
  activeEnd: number
  avgDomDays: number
}

/** Aggregate one district's monthly snapshots; null without any priced month. */
export function quarterStats(rows: QuarterSnapshotRow[]): QuarterStats | null {
  const clean = rows.filter((r) => r.avgPricePerSqm > 0)
  if (!clean.length) return null
  const medians = clean.map((r) => r.medianPrice).filter((v): v is number => !!v && v > 0)
  return {
    months: clean.length,
    avgPerM2USD: Math.round(clean.reduce((a, r) => a + r.avgPricePerSqm, 0) / clean.length),
    medianPriceUSD: medianOf(medians),
    soldCount: clean.reduce((a, r) => a + r.soldCount, 0),
    newListings: clean.reduce((a, r) => a + r.newListingsCount, 0),
    activeEnd: clean[clean.length - 1]!.activeListingsCount,
    avgDomDays: Math.round(clean.reduce((a, r) => a + r.avgDaysOnMarket, 0) / clean.length),
  }
}

/** City total: active-listings-weighted mean of district quarter averages. */
export function weightedTotal(stats: { avgPerM2USD: number; activeEnd: number }[]): number | null {
  const weight = stats.reduce((a, s) => a + s.activeEnd, 0)
  if (weight <= 0) return null
  return Math.round(stats.reduce((a, s) => a + s.avgPerM2USD * s.activeEnd, 0) / weight)
}
