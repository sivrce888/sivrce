/**
 * Duplicate + fraud detection core — pure functions, no DB.
 * Consumed by the dedupe-fraud cron job; asserted by dedupe-core.check.ts.
 *
 * Three cluster methods (Cian/Avito-style proven mechanisms):
 *  - phone_facts: same normalized phone + same deal/type/city/rooms/floor/area
 *    bucket → almost certainly the same seller reposting the same property.
 *  - geo_facts: same ~110m map cell + district + facts, any seller → the
 *    Georgian cross-posting pain (owner + N agents on one flat).
 *  - fuzzy_facts: same cell + rooms with drifted area/floor and reworded text
 *    (token-set similarity) → catches repriced/rewritten reposts the exact
 *    hashes miss. Lower confidence; humans still resolve.
 *
 * ponytail: token-set Jaccard, not embeddings — misses cross-language rewrites
 * and photo-identical reposts; upgrade to image dhash, then multilingual
 * embeddings, if the admin queue runs dry.
 */

export type DupeListing = {
  id: string
  ownerId: string | null
  verified: boolean
  createdAt: Date
  dealType: string
  propertyType: string
  city: string
  district: string
  rooms: number
  floor: number | null
  area: number
  lat: number
  lng: number
  listingPhone: string | null
  price: number
  currency: string
  pricePerSqm: number | null
}

/** Georgian numbers: keep the last 9 digits (555123456 / 322123456 tails). */
export function phoneKey(p: string | null | undefined): string | null {
  if (!p) return null
  const digits = p.replace(/\D+/g, "")
  return digits.length >= 9 ? digits.slice(-9) : null
}

/** ±2.5m² tolerance — reposted areas drift by a meter or two, not more. */
export function areaBucket(area: number): number {
  return Math.round(area / 5) * 5
}

export function phoneFactsSignature(l: DupeListing): string | null {
  const ph = phoneKey(l.listingPhone)
  if (!ph) return null
  return [
    "p", l.dealType, l.propertyType, l.city, ph,
    l.rooms, l.floor ?? 0, areaBucket(l.area),
  ].join("|")
}

export function geoFactsSignature(l: DupeListing): string {
  return [
    "g", l.dealType, l.propertyType, l.city, l.district,
    l.rooms, l.floor ?? 0, areaBucket(l.area),
    Math.round(l.lat * 1000), Math.round(l.lng * 1000),
  ].join("|")
}

/** Original wins: verified first, then oldest, then stable id order. */
export function pickRepresentative<T extends { id: string; verified: boolean; createdAt: Date }>(
  rows: T[],
): T {
  return [...rows].sort(
    (a, b) =>
      Number(b.verified) - Number(a.verified) ||
      a.createdAt.getTime() - b.createdAt.getTime() ||
      (a.id < b.id ? -1 : 1),
  )[0]
}

export function perSqmUsd(l: DupeListing, usdGel: number): number {
  const per = l.pricePerSqm ?? (l.area > 0 ? l.price / l.area : 0)
  return l.currency === "USD" ? per : per / usdGel
}

export type PriceOutlier = { median: number; ratio: number }

/**
 * Flag listings whose USD/m² sits >4× above or <¼ below the city median for
 * the same deal+property type. Needs ≥8 samples — thin markets stay quiet.
 */
export function priceOutliers(
  listings: DupeListing[],
  usdGel: number,
): Map<string, PriceOutlier> {
  const groups = new Map<string, { values: number[]; items: DupeListing[] }>()
  for (const l of listings) {
    const per = perSqmUsd(l, usdGel)
    if (per <= 0) continue // zero/draft prices are not "outliers"
    const key = `${l.dealType}|${l.propertyType}|${l.city}`
    const g = groups.get(key)
    if (g) {
      g.values.push(per)
      g.items.push(l)
    } else {
      groups.set(key, { values: [per], items: [l] })
    }
  }
  const out = new Map<string, PriceOutlier>()
  for (const { values, items } of groups.values()) {
    if (values.length < 8) continue
    const sorted = [...values].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    for (const l of items) {
      const ratio = perSqmUsd(l, usdGel) / median
      if (ratio > 4 || ratio < 0.25) out.set(l.id, { median, ratio })
    }
  }
  return out
}

export const CONFIDENCE = { phone_facts: 0.92, geo_facts: 0.78, fuzzy_facts: 0.62 } as const

/** Coarse block for the fuzzy pass — floor/area intentionally excluded (they drift). */
export function fuzzyBlockKey(l: Pick<DupeListing, "dealType" | "propertyType" | "city" | "district" | "rooms" | "lat" | "lng">): string {
  return [
    "f", l.dealType, l.propertyType, l.city, l.district,
    l.rooms, Math.round(l.lat * 1000), Math.round(l.lng * 1000),
  ].join("|")
}

const STOPWORDS = new Set(
  "და არ ეს ის რომ რაც როგორც ასევე the and for with sale rent იყიდება ქირავდება продается продажа аренда и в на с от квартира".split(" "),
)

/** Lowercase unicode tokens, ≥2 chars, stopwords dropped. No stemming — Jaccard absorbs it. */
export function textTokens(s: string | null | undefined): Set<string> {
  const out = new Set<string>()
  if (!s) return out
  for (const tok of s.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (tok.length >= 2 && !STOPWORDS.has(tok)) out.add(tok)
  }
  return out
}

export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

/** v1 calibration: title+lead overlap 0.35 with area inside ±15%. Tune from admin resolutions. */
export const FUZZY_JACCARD_MIN = 0.35
export const FUZZY_AREA_TOL = 0.15
/** Pairwise ceiling per block — same-cell+rooms blocks are tiny; skip pathological ones. */
export const FUZZY_BLOCK_MAX = 64

export type FuzzyRow = Pick<
  DupeListing,
  "id" | "dealType" | "propertyType" | "city" | "district" | "rooms" | "area" | "lat" | "lng"
> & { title: string; description: string }

function fuzzyPair(a: FuzzyRow, b: FuzzyRow): boolean {
  const denom = Math.max(a.area, b.area)
  if (denom <= 0 || Math.abs(a.area - b.area) / denom > FUZZY_AREA_TOL) return false
  const ta = textTokens(`${a.title} ${a.description.slice(0, 500)}`)
  const tb = textTokens(`${b.title} ${b.description.slice(0, 500)}`)
  return jaccard(ta, tb) >= FUZZY_JACCARD_MIN
}

/**
 * Cluster reworded reposts: block tight (cell+rooms), link loose (text+area),
 * merge transitively (A~B, B~C → one flat relisted three ways). Returns groups ≥2.
 */
export function clusterFuzzy<T extends FuzzyRow>(rows: T[]): T[][] {
  const blocks = new Map<string, T[]>()
  for (const r of rows) {
    const k = fuzzyBlockKey(r)
    const arr = blocks.get(k)
    if (arr) arr.push(r)
    else blocks.set(k, [r])
  }
  const out: T[][] = []
  for (const block of blocks.values()) {
    if (block.length < 2 || block.length > FUZZY_BLOCK_MAX) continue
    const parent = block.map((_, i) => i)
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)))
    for (let i = 0; i < block.length; i++) {
      for (let j = i + 1; j < block.length; j++) {
        if (fuzzyPair(block[i]!, block[j]!)) {
          parent[find(i)] = find(j)
        }
      }
    }
    const groups = new Map<number, T[]>()
    block.forEach((r, i) => {
      const root = find(i)
      const arr = groups.get(root)
      if (arr) arr.push(r)
      else groups.set(root, [r])
    })
    for (const g of groups.values()) if (g.length >= 2) out.push(g)
  }
  return out
}
