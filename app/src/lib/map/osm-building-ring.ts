/**
 * Single-pin OSM building ring (Overpass). Used when auto-creating corpus buildings.
 * Prefer containing way/relation-outer; else nearest; near-tie → larger.
 * ponytail: closed outers only. Legal site → napr-parcel (NAPR CadRepGeo).
 */

import { haversineM, ringBboxHalfM } from './buildings'
import { closeRing, ringCentroid, ringContains } from './pick-building'

type Ring = [number, number][]

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

type OsmNode = { lon: number; lat: number }
type OsmEl = {
  type: string
  geometry?: OsmNode[]
  members?: Array<{ type: string; role?: string; geometry?: OsmNode[] }>
}

function nodesToRing(geom: OsmNode[] | undefined): Ring | null {
  if (!geom || geom.length < 4) return null
  const ring = closeRing(geom.map((g) => [g.lon, g.lat] as [number, number]))
  return ring.length >= 5 ? ring : null
}

/** Closed outer rings from a way or building multipolygon relation. */
function elementRings(el: OsmEl): Ring[] {
  if (el.type === 'way') {
    const r = nodesToRing(el.geometry)
    return r ? [r] : []
  }
  if (el.type !== 'relation' || !el.members) return []
  const out: Ring[] = []
  for (const m of el.members) {
    if (m.type !== 'way') continue
    if (m.role && m.role !== 'outer') continue
    const r = nodesToRing(m.geometry)
    if (r) out.push(r)
  }
  return out
}

function pickBestRing(rings: Ring[], lat: number, lng: number, radiusM: number): Ring | null {
  let bestContain: Ring | null = null
  let bestContainHalf = 0
  let best: Ring | null = null
  let bestDist = Infinity
  let bestHalf = 0
  for (const ring of rings) {
    const half = ringBboxHalfM(ring)
    if (ringContains(ring, lng, lat)) {
      if (half > bestContainHalf) {
        bestContain = ring
        bestContainHalf = half
      }
      continue
    }
    const c = ringCentroid(ring)
    const d = haversineM(lat, lng, c.lat, c.lng)
    if (d > radiusM) continue
    if (d + 12 < bestDist || (Math.abs(d - bestDist) <= 12 && half > bestHalf)) {
      best = ring
      bestDist = d
      bestHalf = half
    }
  }
  return bestContain ?? best
}

/** Pure: Overpass elements → best ring (checkable without network). */
export function pickOsmBuildingRingFromElements(
  elements: OsmEl[],
  lat: number,
  lng: number,
  radiusM = 70,
): Ring | null {
  const rings: Ring[] = []
  for (const el of elements) rings.push(...elementRings(el))
  return pickBestRing(rings, lat, lng, radiusM)
}

/** Nearest / containing OSM building ring within radiusM. */
export async function fetchOsmBuildingRing(
  lat: number,
  lng: number,
  radiusM = 70,
): Promise<Ring | null> {
  const data = `[out:json][timeout:12];(way(around:${radiusM},${lat},${lng})["building"];relation(around:${radiusM},${lat},${lng})["building"];);out geom;`
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(data)}`,
        signal: AbortSignal.timeout(14_000),
      })
      if (!res.ok) continue
      const json = (await res.json()) as { elements?: OsmEl[] }
      const best = pickOsmBuildingRingFromElements(json.elements ?? [], lat, lng, radiusM)
      if (best) return best
    } catch {
      /* try next endpoint */
    }
  }
  return null
}
