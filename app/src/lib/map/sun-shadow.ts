/**
 * Building shadow geometry for the detail map sun scrubber.
 * Parallel projection of the footprint ring along the anti-solar azimuth,
 * scaled by the building's real tile height; the rendered shape is the convex
 * hull of footprint ∪ projected footprint so the shadow never detaches.
 * Direction is exact solar math; length is exact for the one highlighted
 * building — neighbouring shading is out of scope.
 */

import { sunPosition } from '@/lib/sun'

const RAD = Math.PI / 180

/** Sun below this altitude renders no shadow — the sliver would lie anyway. */
const MIN_ALTITUDE = 2

/** Hard cap on shadow reach so a 3° sun doesn't project the building to horizon. */
const MAX_REACH_M = 150

/** Nominal height when the tile has no render_height (drawn footprints). */
export const NOMINAL_HEIGHT_M = 24

export type LngLatRing = [number, number][]

/** Andrew's monotone chain — hull of ≤~200 footprint vertices, exact on collinear edges. */
export function convexHullLngLat(points: LngLatRing): LngLatRing {
  if (points.length < 3) return points
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (
    o: [number, number],
    a: [number, number],
    b: [number, number],
  ) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: LngLatRing = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0)
      lower.pop()
    lower.push(p)
  }
  const upper: LngLatRing = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0)
      upper.pop()
    upper.push(p)
  }
  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

/** Horizontal shadow reach in metres for a wall of `heightM` under `altitudeDeg`. */
function reachM(heightM: number, altitudeDeg: number): number {
  return Math.min(heightM / Math.tan(altitudeDeg * RAD), MAX_REACH_M)
}

/**
 * Closed convex hull polygon (lng,lat) of the building plus its cast shadow,
 * or null while the sun is below MIN_ALTITUDE. Azimuth: ° clockwise from north.
 */
export function shadowPolygon(
  ring: LngLatRing,
  heightM: number,
  azimuthDeg: number,
  altitudeDeg: number,
): LngLatRing | null {
  if (ring.length < 3 || !Number.isFinite(heightM) || heightM <= 0) return null
  if (altitudeDeg < MIN_ALTITUDE || altitudeDeg >= 90) return null
  const lat0 = ring.reduce((s, p) => s + p[1], 0) / ring.length
  // Shadow falls opposite the sun; east/north metres → degrees at this latitude.
  const dir = (azimuthDeg + 180) * RAD
  const reach = reachM(heightM, altitudeDeg)
  const dLat = (Math.cos(dir) * reach) / 110_540
  const dLng = (Math.sin(dir) * reach) / (111_320 * Math.cos(lat0 * RAD))
  const pts: LngLatRing = [...ring]
  for (const [lng, lat] of ring) pts.push([lng + dLng, lat + dLat])
  return closeHull(convexHullLngLat(pts))
}

/** Point-in-hull sanity uses this; keeps the first vertex repeated. */
function closeHull(hull: LngLatRing): LngLatRing {
  return hull.length >= 3 && (hull[0]![0] !== hull[hull.length - 1]![0] || hull[0]![1] !== hull[hull.length - 1]![1])
    ? [...hull, hull[0]!]
    : hull
}

/** Sun state + hull in one call for the map layer. */
export function shadowFeature(
  ring: LngLatRing,
  heightM: number,
  lat: number,
  lng: number,
  date: Date,
): { polygon: LngLatRing; altitude: number; azimuth: number } | null {
  const { altitude, azimuth } = sunPosition(lat, lng, date)
  const polygon = shadowPolygon(ring, heightM, azimuth, altitude)
  return polygon ? { polygon, altitude, azimuth } : null
}
