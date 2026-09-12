/**
 * Comps-aware similar-listing ranking — pure scoring, no DB.
 * getSimilarListings fetches newest-in-district; this re-orders by what buyers
 * actually compare: same street → same layout → close price/m² → close area →
 * walking distance. Stable sort keeps recency on ties.
 * Server-only (street-href carries the streets JSON — never import from client).
 * ponytail: integer weights, unknown-safe reads; ML comps only with click data.
 */

import { streetHrefForListing } from '@/lib/street-href'

export interface RankCand {
  id: string
  [key: string]: unknown
}

type AnyRec = Record<string, unknown>

const rec = (c: { id: string }): AnyRec => c as AnyRec
const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null
const str = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null

function roomsOf(c: AnyRec): number | null {
  return num(c.rooms) ?? num(c.bedrooms) ?? num(c.beds)
}

function priceOf(c: AnyRec): number | null {
  return num(c.priceUSD) ?? num(c.price)
}

function perM2(self: AnyRec, c: AnyRec): [number, number] | null {
  const pa = priceOf(self)
  const pb = priceOf(c)
  if (pa == null || pb == null || pa <= 0 || pb <= 0) return null
  const aa = num(self.area)
  const ab = num(c.area)
  if (aa != null && ab != null && aa > 0 && ab > 0) return [pa / aa, pb / ab]
  return [pa, pb]
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const toR = Math.PI / 180
  const dLat = (bLat - aLat) * toR
  const dLng = (bLng - aLng) * toR
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(aLat * toR) * Math.cos(bLat * toR) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Explainable integer score — higher = more comparable. */
export function peerScore(self: { id: string }, cand: { id: string }): number {
  const s: AnyRec = rec(self)
  const c: AnyRec = rec(cand)
  if (c.id === s.id) return -1
  let score = 0
  const sAddr = str(s.address)
  const cAddr = str(c.address)
  if (sAddr && cAddr) {
    const sHref = streetHrefForListing(sAddr, str(s.district) ?? '', str(s.city) ?? '')
    const cHref = streetHrefForListing(cAddr, str(c.district) ?? '', str(c.city) ?? '')
    if (sHref && sHref === cHref) score += 50
  }
  const sr = roomsOf(s)
  const cr = roomsOf(c)
  if (sr != null && cr != null && sr === cr) score += 20
  const m2 = perM2(s, c)
  if (m2) {
    const drift = Math.abs(m2[0] - m2[1]) / m2[0]
    if (drift <= 0.15) score += 20
    else if (drift <= 0.3) score += 10
  }
  const sa = num(s.area)
  const ca = num(c.area)
  if (sa != null && ca != null && sa > 0 && Math.abs(sa - ca) / sa <= 0.2) score += 10
  const sLat = num(s.lat ?? (s.coords as { lat?: unknown } | undefined)?.lat)
  const sLng = num(s.lng ?? (s.coords as { lng?: unknown } | undefined)?.lng)
  const cLat = num(c.lat ?? (c.coords as { lat?: unknown } | undefined)?.lat)
  const cLng = num(c.lng ?? (c.coords as { lng?: unknown } | undefined)?.lng)
  if (sLat != null && sLng != null && cLat != null && cLng != null) {
    const km = haversineKm(sLat, sLng, cLat, cLng)
    if (km <= 1) score += 10
    else if (km <= 2.5) score += 5
  }
  return score
}

/** Best comps first; self excluded; ties keep input (recency) order. */
export function rankPeers<T extends { id: string }>(self: { id: string }, cands: T[]): T[] {
  return cands
    .filter((c) => c.id !== self.id)
    .map((c, i) => ({ c, s: peerScore(self, c), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.c)
}

/**
 * Price-scale sample: ranked comps' $/m² (already best-first) wins over the
 * district average — same street/layout comps price sharper than the district.
 * Falls back to district peers below 2 comps. Pure; caller decides nothing.
 */
export function scalePeers(
  ranked: { perM2USD?: unknown }[],
  district: number[],
): number[] {
  const comps = ranked
    .map((r) => (typeof r.perM2USD === 'number' && Number.isFinite(r.perM2USD) && r.perM2USD > 0 ? r.perM2USD : null))
    .filter((v): v is number => v != null)
    .slice(0, 6)
  return comps.length >= 2 ? comps : district
}
