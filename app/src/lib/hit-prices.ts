/**
 * Normalize /api/search hit prices → Listing USD/GEL bases.
 * Hits may be Meili (has priceUSD / pricePerSqmUSD) or DB (price + currency).
 * pricePerSqm is in the listing's own currency unless pricePerSqmUSD is set.
 */
import { USD_GEL } from '@/data/listings'

export function hitPrices(h: {
  price?: unknown
  currency?: unknown
  priceUSD?: unknown
  pricePerSqm?: unknown
  pricePerSqmUSD?: unknown
  area?: unknown
}): { priceUSD: number; priceGEL: number; perM2USD: number } {
  const raw = Number(h.price)
  const amount = Number.isFinite(raw) ? raw : 0
  const gel = h.currency === 'GEL'
  const indexed = Number(h.priceUSD)
  const priceUSD =
    Number.isFinite(indexed) && indexed > 0
      ? Math.round(indexed)
      : gel
        ? Math.round(amount / USD_GEL)
        : Math.round(amount)
  const priceGEL = Math.round(priceUSD * USD_GEL)

  const indexedM2 = Number(h.pricePerSqmUSD)
  if (Number.isFinite(indexedM2) && indexedM2 > 0) {
    return { priceUSD, priceGEL, perM2USD: Math.round(indexedM2) }
  }

  const rawM2 = Number(h.pricePerSqm)
  let m2 = Number.isFinite(rawM2) ? rawM2 : 0
  if (m2 <= 0) {
    const area = Number(h.area)
    if (Number.isFinite(area) && area > 0 && amount > 0) m2 = amount / area
  }
  const perM2USD = m2 <= 0 ? 0 : gel ? Math.round(m2 / USD_GEL) : Math.round(m2)
  return { priceUSD, priceGEL, perM2USD }
}
