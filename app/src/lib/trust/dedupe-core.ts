/**
 * Duplicate + fraud detection core — pure functions, no DB.
 * Consumed by the dedupe-fraud cron job; asserted by dedupe-core.check.ts.
 *
 * Two cluster methods (Cian/Avito-style proven mechanisms):
 *  - phone_facts: same normalized phone + same deal/type/city/rooms/floor/area
 *    bucket → almost certainly the same seller reposting the same property.
 *  - geo_facts: same ~110m map cell + district + facts, any seller → the
 *    Georgian cross-posting pain (owner + N agents on one flat).
 *
 * ponytail: exact-fact hashing, not fuzzy similarity — misses reworded/repriced
 * reposts with drifted area or a different pin cell; upgrade to token-set
 * similarity + image phash if admin queue runs dry.
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
  const groups = new Map<string, number[]>()
  for (const l of listings) {
    const per = perSqmUsd(l, usdGel)
    if (per <= 0) continue
    const key = `${l.dealType}|${l.propertyType}|${l.city}`
    const arr = groups.get(key)
    if (arr) arr.push(per)
    else groups.set(key, [per])
  }
  const out = new Map<string, PriceOutlier>()
  for (const [key, values] of groups) {
    if (values.length < 8) continue
    const sorted = [...values].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    for (const l of listings) {
      if (`${l.dealType}|${l.propertyType}|${l.city}` !== key) continue
      const per = perSqmUsd(l, usdGel)
      if (per <= 0) continue // zero/draft prices are not "outliers"
      const ratio = per / median
      if (ratio > 4 || ratio < 0.25) out.set(l.id, { median, ratio })
    }
  }
  return out
}

export const CONFIDENCE = { phone_facts: 0.92, geo_facts: 0.78 } as const
