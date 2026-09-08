/**
 * Building shadow geometry + sun lighting for the detail map sun scrubber.
 * Parallel projection of the footprint ring along the anti-solar azimuth,
 * scaled by the building's real tile height; the rendered shape is the convex
 * hull of footprint ∪ projected footprint so the shadow never detaches.
 * Direction is exact solar math; length is exact for the one highlighted
 * building — neighbouring shading is out of scope.
 */

import { sunPosition } from '@/lib/sun'

const RAD = Math.PI / 180

/** Sun below this altitude renders no shadow — the sliver would lie anyway. */
export const MIN_ALTITUDE = 2

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

/**
 * Fill-extrusion light + sky for the sun scrubber — pure, no maplibre import.
 * `position` is the style-spec [radial, azimuthal°N-cw, polar°] triple with
 * polar = zenith angle (0° overhead), so the map light IS the sun.
 */
export type SunLight = {
  position: [number, number, number]
  color: string
  intensity: number
}

export type SunSky = {
  'sky-color': string
  'horizon-color': string
}

/** Style-spec default light — what we restore when the scrubber turns off. */
export const MAP_DEFAULT_LIGHT: SunLight = {
  position: [1.15, 210, 30],
  color: '#ffffff',
  intensity: 0.5,
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Channel-wise hex lerp — two known-good colors, no color lib. */
export function mixHex(a: string, b: string, t: number): string {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16))
  const pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16))
  const out = pa.map((v, i) => Math.round(v + ((pb[i] ?? v) - v) * t))
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

const WARM = '#ffb562'
const DAYLIGHT = '#ffffff'

/** Sky brightens with the sun; the horizon band keeps the dawn/dusk warmth. */
export function sunSky(altitudeDeg: number): SunSky {
  const day = clamp01(altitudeDeg / 25)
  return {
    'sky-color': mixHex('#5e93cf', '#87c0f2', day),
    'horizon-color': mixHex('#ffc089', '#ddebf7', day),
  }
}

/** Map light pinned to the real sun — warm + low at dawn/dusk, white + steep at noon. */
export function sunLight(altitudeDeg: number, azimuthDeg: number): SunLight {
  if (altitudeDeg < MIN_ALTITUDE) {
    // Twilight: keep a faint cool cast so extrusions never go fully flat.
    return { position: [1.5, azimuthDeg, 92], color: '#93a7db', intensity: 0.12 }
  }
  const day = clamp01(altitudeDeg / 25)
  return {
    position: [1.5, azimuthDeg, Math.min(88, Math.max(2, 90 - altitudeDeg))],
    color: mixHex(WARM, DAYLIGHT, day),
    intensity: 0.3 + 0.4 * day,
  }
}
