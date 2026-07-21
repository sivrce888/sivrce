/**
 * Pin → OSM building ring helpers for MapEmbed pick/highlight.
 * ponytail: vertex average + square fallback; upgrade → turf.centroid when rings get wild.
 *
 * Full-building mark (locked by Beliashvili 68 / Digomi slabs):
 *  - Prefer real OSM outer ring (shape + size), never a fixed square when OSM is near.
 *  - Pin inside a ring → that building (largest if nested); else nearest centroid.
 *  - Search radius OSM_PICK_RADIUS_M (~90 m) — address pins often sit on the curb/bus stop.
 *  - MultiPolygon → largest outer ring (not parts[0] — that marks half a block).
 *  - Fallback square only when OSM miss: halfM=26, aspect=1.4 (~52×73 m slab).
 */

import {
  buildingFootprint,
  FALLBACK_FOOTPRINT_ASPECT,
  FALLBACK_FOOTPRINT_HALF_M,
  FOOTPRINT_MAX_PIN_M,
  haversineM,
  ringBboxHalfM,
} from './buildings'

export type LngLat = { lat: number; lng: number }

/** How far from pin to accept an OSM building for highlight/snap. */
export const OSM_PICK_RADIUS_M = FOOTPRINT_MAX_PIN_M

export { FALLBACK_FOOTPRINT_ASPECT, FALLBACK_FOOTPRINT_HALF_M }

function ringApproxAreaM2(ring: [number, number][]): number {
  const half = ringBboxHalfM(ring)
  return 4 * half * half
}

/** Outer ring from a Polygon / MultiPolygon feature, else null. */
export function geometryRing(
  geometry: GeoJSON.Geometry | null | undefined,
): [number, number][] | null {
  if (!geometry) return null
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0]
    return ring && ring.length >= 4 ? (ring as [number, number][]) : null
  }
  if (geometry.type === 'MultiPolygon') {
    // ponytail: largest outer — first part is often one wing of a split block.
    let best: [number, number][] | null = null
    let bestArea = -1
    for (const poly of geometry.coordinates) {
      const ring = poly[0]
      if (!ring || ring.length < 4) continue
      const typed = ring as [number, number][]
      const a = ringApproxAreaM2(typed)
      if (a > bestArea) {
        bestArea = a
        best = typed
      }
    }
    return best
  }
  return null
}

/** Cheap centroid — good enough for building footprints. */
export function ringCentroid(ring: [number, number][]): LngLat {
  let x = 0
  let y = 0
  const n = ring.length - (ring[0]![0] === ring[ring.length - 1]![0] && ring[0]![1] === ring[ring.length - 1]![1] ? 1 : 0)
  const count = Math.max(n, 1)
  for (let i = 0; i < count; i++) {
    x += ring[i]![0]
    y += ring[i]![1]
  }
  return { lng: x / count, lat: y / count }
}

/** Ray-cast point-in-ring (lng/lat). Closed or open rings OK. */
export function ringContains(
  ring: [number, number][],
  lng: number,
  lat: number,
): boolean {
  const last = ring.length - 1
  const closed =
    last > 0 && ring[0]![0] === ring[last]![0] && ring[0]![1] === ring[last]![1]
  const end = closed ? last : ring.length
  if (end < 3) return false
  let inside = false
  for (let i = 0, j = end - 1; i < end; j = i++) {
    const xi = ring[i]![0]!
    const yi = ring[i]![1]!
    const xj = ring[j]![0]!
    const yj = ring[j]![1]!
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Among rendered OSM hits, pick the building that owns this pin:
 * 1) ring that contains the pin (largest wins — wing vs shed)
 * 2) else closest centroid within OSM_PICK_RADIUS_M; near-ties → larger
 */
export function pickNearestBuildingGeometry(
  geometries: Array<GeoJSON.Geometry | null | undefined>,
  lat: number,
  lng: number,
  maxM = OSM_PICK_RADIUS_M,
): GeoJSON.Geometry | null {
  let bestContain: GeoJSON.Geometry | null = null
  let bestContainHalf = 0
  let best: GeoJSON.Geometry | null = null
  let bestDist = Infinity
  let bestHalf = 0
  for (const g of geometries) {
    if (!g) continue
    const ring = geometryRing(g)
    if (!ring) continue
    const half = ringBboxHalfM(ring)
    if (ringContains(ring, lng, lat)) {
      if (half > bestContainHalf) {
        bestContain = g
        bestContainHalf = half
      }
      continue
    }
    const c = ringCentroid(ring)
    const d = haversineM(lat, lng, c.lat, c.lng)
    if (d > maxM) continue
    if (d + 12 < bestDist || (Math.abs(d - bestDist) <= 12 && half > bestHalf)) {
      best = g
      bestDist = d
      bestHalf = half
    }
  }
  return bestContain ?? best
}

/** Highlight polygon for a pin — OSM ring if given, else Digomi-sized slab. */
export function pickHighlightPolygon(
  lat: number,
  lng: number,
  osmGeometry?: GeoJSON.Geometry | null,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const ring = geometryRing(osmGeometry)
  return {
    type: 'Feature',
    properties: {},
    geometry: ring
      ? { type: 'Polygon', coordinates: [ring] }
      : buildingFootprint(lat, lng, FALLBACK_FOOTPRINT_HALF_M, FALLBACK_FOOTPRINT_ASPECT),
  }
}

/** Prefer building centroid when click hit an OSM footprint. */
export function snapPick(
  click: LngLat,
  osmGeometry?: GeoJSON.Geometry | null,
): LngLat {
  const ring = geometryRing(osmGeometry)
  return ring ? ringCentroid(ring) : click
}

/** Ensure first===last for GeoJSON Polygon rings. */
export function closeRing(ring: [number, number][]): [number, number][] {
  if (ring.length === 0) return ring
  const first = ring[0]!
  const last = ring[ring.length - 1]!
  if (first[0] === last[0] && first[1] === last[1]) return ring
  return [...ring, [first[0], first[1]]]
}

function coerceRingPoints(ring: unknown[]): [number, number][] | null {
  if (ring.length < 3) return null
  const out: [number, number][] = []
  for (const p of ring) {
    if (!Array.isArray(p) || p.length < 2) return null
    const lng = Number(p[0])
    const lat = Number(p[1])
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
    out.push([lng, lat])
  }
  return out.length >= 3 ? out : null
}

/** `{ring:[[lng,lat],…]}` or raw `[[lng,lat],…]` (attribution historically stored the array). */
export function parseFootprintRing(raw: unknown): [number, number][] | null {
  if (!raw) return null
  if (Array.isArray(raw)) return coerceRingPoints(raw)
  if (typeof raw !== 'object') return null
  const ring = (raw as { ring?: unknown }).ring
  return Array.isArray(ring) ? coerceRingPoints(ring) : null
}

/** NW → NE → SE → SW for MapLibre `image` source. */
export function ringToImageCoords(
  ring: [number, number][],
): [[number, number], [number, number], [number, number], [number, number]] {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  return [
    [minLng, maxLat],
    [maxLng, maxLat],
    [maxLng, minLat],
    [minLng, minLat],
  ]
}
