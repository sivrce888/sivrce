/**
 * Pin → OSM building ring helpers for MapEmbed pick/highlight.
 * ponytail: vertex average + square fallback; upgrade → turf.centroid when rings get wild.
 */

import { buildingFootprint } from './buildings'

export type LngLat = { lat: number; lng: number }

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
    const ring = geometry.coordinates[0]?.[0]
    return ring && ring.length >= 4 ? (ring as [number, number][]) : null
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

/** Highlight polygon for a pin — OSM ring if given, else ~28 m square. */
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
      : buildingFootprint(lat, lng, 14),
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

/** `{ring:[[lng,lat],…]}` from admin JSON / form. */
export function parseFootprintRing(raw: unknown): [number, number][] | null {
  if (!raw || typeof raw !== 'object') return null
  const ring = (raw as { ring?: unknown }).ring
  if (!Array.isArray(ring) || ring.length < 3) return null
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
