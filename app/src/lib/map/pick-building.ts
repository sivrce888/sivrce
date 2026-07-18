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
