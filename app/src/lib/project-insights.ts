/**
 * Decision numbers for project + developer pages, derived only from the live
 * catalog (no invented figures): where a project's "from" price sits among
 * its peers, and a developer's delivery record. Pure — pages pass projectsLive().
 */

import { finishMaxYear, isDelivered, type Project } from '@/data/professionals'
import { TBILISI_DISTRICT_LABELS } from '@/data/district-labels'
import { cityName, hasPriceFrom, type DirLoc } from '@/lib/directory-seo-lite'
import { priceScaleOf } from '@/lib/price-scale'

export type PriceCurrency = 'GEL' | 'EUR' | 'USD'

/** "$2,100" | "₾4,224" | "$1 950" → 2100 / 4224 / 1950; on-request / empty → null. */
export function priceM2Number(priceFromM2: string): number | null {
  if (!hasPriceFrom(priceFromM2)) return null
  const n = Number(priceFromM2.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** ponytail: GEL if ₾/GEL marker, EUR if €/EUR (Berlin), else USD — covers catalog + live merge. */
export function priceM2Currency(priceFromM2: string): PriceCurrency {
  if (/₾|GEL/i.test(priceFromM2)) return 'GEL'
  if (/€|EUR/i.test(priceFromM2)) return 'EUR'
  return 'USD'
}

/**
 * DB pricePerSqmFrom → display string. The column has no currency: SS.ge
 * imports (id `ss_*`) store the House API's `priceGeo` — lari — while
 * korter/myhome/owner rows are USD. Rendering ss rows as '$' inflated 265
 * projects ~2.7×; they keep their real ₾ figure instead.
 */
export function rowPriceM2(r: { id?: string; pricePerSqmFrom: number }): string {
  if (!(r.pricePerSqmFrom > 0)) return ''
  const n = r.pricePerSqmFrom.toLocaleString('en-US')
  return r.id?.startsWith('ss_') ? `₾${n}` : `$${n}`
}

/** Fewer peers than this and a percentile is noise — the block hides instead. */
export const MIN_PEERS = 5

/**
 * Beyond ±50% of the median the peer set is almost always the wrong one (a
 * suburban cottage village against city towers, a data error) — make no claim.
 */
export const MAX_ABS_DELTA = 50

export interface MarketPosition {
  /** 'district' when the district alone has MIN_PEERS priced peers, else the city. */
  scope: 'district' | 'city'
  peers: number
  median: number
  /** Signed % vs the peer median, rounded (−12 = 12% cheaper). */
  deltaPct: number
  /** 5–95 marker position (priceScaleOf percentile). */
  pct: number
  currency: PriceCurrency
  min: number
  max: number
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

/**
 * Percentile of a project's "from" $/m² among priced projects in the same
 * district (else city) and currency. Delivered buildings stay in — they are
 * the resale benchmark buyers compare against.
 */
export function marketPosition(p: Project, all: readonly Project[]): MarketPosition | null {
  const value = priceM2Number(p.priceFromM2)
  if (value === null) return null
  const currency = priceM2Currency(p.priceFromM2)
  const priced = all.filter(
    (q) =>
      q.slug !== p.slug &&
      q.city === p.city &&
      priceM2Currency(q.priceFromM2) === currency &&
      priceM2Number(q.priceFromM2) !== null,
  )
  const inDistrict = p.district ? priced.filter((q) => q.district === p.district) : []
  const scope = inDistrict.length >= MIN_PEERS ? 'district' : 'city'
  const peers = (scope === 'district' ? inDistrict : priced).map((q) => priceM2Number(q.priceFromM2)!)
  if (peers.length < MIN_PEERS) return null
  const med = median(peers)
  const deltaPct = Math.round(((value - med) / med) * 100)
  if (Math.abs(deltaPct) > MAX_ABS_DELTA) return null
  return {
    scope,
    peers: peers.length,
    median: med,
    deltaPct,
    pct: priceScaleOf(value, peers).pct,
    currency,
    min: Math.min(...peers, value),
    max: Math.max(...peers, value),
  }
}

/** Median of a sorted array with the element at `skip` removed (the project itself). */
function medianWithout(sorted: readonly number[], skip: number): number {
  const at = (r: number) => sorted[r < skip ? r : r + 1]
  const n = sorted.length - 1
  const m = n >> 1
  return n % 2 ? at(m) : Math.round((at(m - 1) + at(m)) / 2)
}

/**
 * Hub-scale marketPosition: one O(n log n) pass instead of O(n²), returning the
 * same scope + deltaPct marketPosition() gives each project (asserted in the
 * check) — so a card chip never disagrees with the detail page.
 */
export function marketDeltas(all: readonly Project[]): Map<string, { scope: 'district' | 'city'; deltaPct: number }> {
  const groups = new Map<string, number[]>()
  const key = (p: Project, d: string) => `${p.city}|${priceM2Currency(p.priceFromM2)}|${d}`
  const priced = all.filter((p) => priceM2Number(p.priceFromM2) !== null)
  for (const p of priced) {
    const v = priceM2Number(p.priceFromM2)!
    for (const k of [key(p, ''), ...(p.district ? [key(p, p.district)] : [])]) {
      const g = groups.get(k)
      if (g) g.push(v)
      else groups.set(k, [v])
    }
  }
  for (const g of groups.values()) g.sort((a, b) => a - b)
  const out = new Map<string, { scope: 'district' | 'city'; deltaPct: number }>()
  for (const p of priced) {
    const v = priceM2Number(p.priceFromM2)!
    const d = p.district ? groups.get(key(p, p.district)) : undefined
    const scope = d && d.length - 1 >= MIN_PEERS ? 'district' : 'city'
    const g = scope === 'district' ? d! : groups.get(key(p, ''))!
    if (g.length - 1 < MIN_PEERS) continue
    const med = medianWithout(g, g.indexOf(v))
    const deltaPct = Math.round(((v - med) / med) * 100)
    if (Math.abs(deltaPct) <= MAX_ABS_DELTA) out.set(p.slug, { scope, deltaPct })
  }
  return out
}

/** Reader-facing name of the peer set: ka district as-is, Latin for other locales, else the city. */
export function scopeLabel(p: Pick<Project, 'city' | 'district'>, scope: 'district' | 'city', loc: DirLoc | 'de'): string {
  if (scope === 'district' && p.district) {
    return loc === 'ka' ? p.district : (TBILISI_DISTRICT_LABELS.find((d) => d.name.ka === p.district)?.name.en ?? p.district)
  }
  return cityName(p.city, loc)
}

export interface TrackRecord {
  total: number
  delivered: number
  building: number
  /** Sum of known flat counts — 0 when none publish one (≤1 = ingest default, not a count). */
  flats: number
  cities: number
}

export function trackRecord(projects: readonly Project[]): TrackRecord {
  const delivered = projects.filter(isDelivered).length
  return {
    total: projects.length,
    delivered,
    building: projects.length - delivered,
    flats: projects.reduce((s, p) => s + (Number.isFinite(p.flats) && p.flats > 1 ? p.flats : 0), 0),
    cities: new Set(projects.map((p) => p.city)).size,
  }
}

/** Portfolio split: soonest handover first while building; newest first once delivered. */
export function splitPortfolio(projects: readonly Project[]): { building: Project[]; delivered: Project[] } {
  const year = (p: Project) => finishMaxYear(p.finish) ?? 0
  const building = projects.filter((p) => !isDelivered(p)).sort((a, b) => (year(a) || 9999) - (year(b) || 9999) || b.done - a.done)
  const delivered = projects.filter(isDelivered).sort((a, b) => year(b) - year(a))
  return { building, delivered }
}
