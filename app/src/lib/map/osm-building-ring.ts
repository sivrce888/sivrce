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
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

type OsmNode = { lon: number; lat: number }
type OsmEl = {
  type: string
  id?: number
  tags?: Record<string, string>
  geometry?: OsmNode[]
  members?: Array<{ type: string; role?: string; geometry?: OsmNode[] }>
}

export type OsmBuildingHit = {
  ring: Ring
  osmId: number
  levels?: number
  heightM?: number
  name?: string
  /** OSM building=* tag (apartments, yes, …). */
  building?: string
}

type Ranked = OsmBuildingHit & { half: number; dist: number; inside: boolean }

function nodesToRing(geom: OsmNode[] | undefined): Ring | null {
  if (!geom || geom.length < 4) return null
  const ring = closeRing(geom.map((g) => [g.lon, g.lat] as [number, number]))
  return ring.length >= 5 ? ring : null
}

function hitFromEl(el: OsmEl, ring: Ring): OsmBuildingHit | null {
  const tags = el.tags ?? {}
  const building = (tags.building || '').trim().toLowerCase()
  // ponytail: skip non-footprint tags; upgrade → full reject list from OSM wiki
  if (building === 'no' || building === 'roof') return null
  const levels = Number(tags['building:levels'] ?? tags.levels)
  const height = Number(tags.height)
  const name = (tags.name || tags['name:ka'] || tags['name:en'] || '').trim()
  const levelsInt =
    Number.isFinite(levels) && levels > 0 ? Math.max(1, Math.round(levels)) : undefined
  return {
    ring,
    osmId: typeof el.id === 'number' ? el.id : 0,
    ...(levelsInt != null ? { levels: levelsInt } : {}),
    ...(Number.isFinite(height) && height > 0
      ? { heightM: height }
      : levelsInt != null
        ? { heightM: Math.min(levelsInt * 3.1, 160) }
        : {}),
    ...(name ? { name } : {}),
    ...(building ? { building } : {}),
  }
}

/** Closed outer rings from a way or building multipolygon relation. */
function elementHits(el: OsmEl): OsmBuildingHit[] {
  if (el.type === 'way') {
    const r = nodesToRing(el.geometry)
    if (!r) return []
    const hit = hitFromEl(el, r)
    return hit ? [hit] : []
  }
  if (el.type !== 'relation' || !el.members) return []
  const out: OsmBuildingHit[] = []
  for (const m of el.members) {
    if (m.type !== 'way') continue
    if (m.role && m.role !== 'outer') continue
    const r = nodesToRing(m.geometry)
    if (!r) continue
    const hit = hitFromEl(el, r)
    if (hit) out.push(hit)
  }
  return out
}

function pickBestHit(hits: OsmBuildingHit[], lat: number, lng: number, radiusM: number): OsmBuildingHit | null {
  let bestContain: Ranked | null = null
  let best: Ranked | null = null
  for (const hit of hits) {
    const half = ringBboxHalfM(hit.ring)
    if (half < 6) continue
    const levelBoost = (hit.levels ?? 0) * 2
    if (ringContains(hit.ring, lng, lat)) {
      const score = half + levelBoost
      if (!bestContain || score > bestContain.half + (bestContain.levels ?? 0) * 2) {
        bestContain = { ...hit, half: score, dist: 0, inside: true }
      }
      continue
    }
    const c = ringCentroid(hit.ring)
    const d = haversineM(lat, lng, c.lat, c.lng)
    if (d > radiusM) continue
    if (
      !best ||
      d + 12 < best.dist ||
      (Math.abs(d - best.dist) <= 12 && half + levelBoost > best.half)
    ) {
      best = { ...hit, half: half + levelBoost, dist: d, inside: false }
    }
  }
  const win = bestContain ?? best
  if (!win) return null
  return {
    ring: win.ring,
    osmId: win.osmId,
    ...(win.levels != null ? { levels: win.levels } : {}),
    ...(win.heightM != null ? { heightM: win.heightM } : {}),
    ...(win.name ? { name: win.name } : {}),
    ...(win.building ? { building: win.building } : {}),
  }
}

/** Pure: Overpass elements → best building hit (checkable without network). */
export function pickOsmBuildingFromElements(
  elements: OsmEl[],
  lat: number,
  lng: number,
  radiusM = 70,
): OsmBuildingHit | null {
  const hits: OsmBuildingHit[] = []
  for (const el of elements) hits.push(...elementHits(el))
  return pickBestHit(hits, lat, lng, radiusM)
}

/** Pure: Overpass elements → best ring (checkable without network). */
export function pickOsmBuildingRingFromElements(
  elements: OsmEl[],
  lat: number,
  lng: number,
  radiusM = 70,
): Ring | null {
  return pickOsmBuildingFromElements(elements, lat, lng, radiusM)?.ring ?? null
}

/** Nearest / containing OSM building with tags within radiusM. */
export async function fetchOsmBuilding(
  lat: number,
  lng: number,
  radiusM = 70,
): Promise<OsmBuildingHit | null> {
  const data = `[out:json][timeout:12];(way(around:${radiusM},${lat},${lng})["building"];relation(around:${radiusM},${lat},${lng})["building"];);out geom;`
  for (const ep of ENDPOINTS) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(data)}`,
        signal: AbortSignal.timeout(14_000),
        cache: 'no-store',
      })
      if (!res.ok) continue
      const json = (await res.json()) as { elements?: OsmEl[] }
      const best = pickOsmBuildingFromElements(json.elements ?? [], lat, lng, radiusM)
      if (best) return best
    } catch {
      /* try next endpoint */
    }
  }
  return null
}

/** Nearest / containing OSM building ring within radiusM. */
export async function fetchOsmBuildingRing(
  lat: number,
  lng: number,
  radiusM = 70,
): Promise<Ring | null> {
  const hit = await fetchOsmBuilding(lat, lng, radiusM)
  return hit?.ring ?? null
}
