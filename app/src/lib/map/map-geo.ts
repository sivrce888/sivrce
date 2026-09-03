/**
 * Map constants + Georgia bbox — no footprints, no catalog.
 * Client pages that only need a pin/bounds import this, not buildings.ts.
 */

import { BRAND } from '@/lib/brand'

/** Construction / corpus meter origin — do not move (baked offsets). */
export const MAP_CENTER = { lat: 41.7151, lng: 44.8271 } as const
/** Add-listing + Tbilisi city pin — Freedom Square (თავისუფლების მოედანი). */
export const FREEDOM_SQUARE = { lat: 41.69365, lng: 44.80115 } as const
/** Soft clamp — Georgia + halo; country-shaped clip is GEORGIA_MASK_FC. */
export const GEORGIA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [38.7, 40.35],
  [47.8, 44.25],
]
export const MAP_MIN_ZOOM = 7
export const GEORGIA_HALO_KM = 50

const [[W, S], [E, N]] = GEORGIA_MAX_BOUNDS

export function inGeorgia(lat: number, lng: number): boolean {
  return lat >= S && lat <= N && lng >= W && lng <= E
}

/** Parse body lat/lng; reject out-of-Georgia. */
export function parseCoords(
  lat: unknown,
  lng: unknown,
): { lat: number; lng: number } | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (!inGeorgia(lat, lng)) return null
  return { lat, lng }
}

/** Expand a closed CW ring outward. ponytail: local ENU + miter cap 4; turf.buffer if the outline gets denser. */
function bufferRingKm(ring: [number, number][], km: number): [number, number][] {
  const n = ring.length - 1
  const out: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const [lng0, lat0] = ring[(i - 1 + n) % n]!
    const [lng1, lat1] = ring[i]!
    const [lng2, lat2] = ring[(i + 1) % n]!
    const kx = 111 * Math.cos((lat1 * Math.PI) / 180)
    const e1x = (lng1 - lng0) * kx
    const e1y = (lat1 - lat0) * 111
    const e2x = (lng2 - lng1) * kx
    const e2y = (lat2 - lat1) * 111
    const l1 = Math.hypot(e1x, e1y) || 1
    const l2 = Math.hypot(e2x, e2y) || 1
    const n1x = -e1y / l1
    const n1y = e1x / l1
    const n2x = -e2y / l2
    const n2y = e2x / l2
    let ox = n1x + n2x
    let oy = n1y + n2y
    const ol = Math.hypot(ox, oy) || 1
    const miter = Math.min(4, 1 / Math.max((ox * n1x + oy * n1y) / ol, 0.05))
    ox = ((ox / ol) * km * miter) / kx
    oy = ((oy / ol) * km * miter) / 111
    out.push([lng1 + ox, lat1 + oy])
  }
  out.push(out[0]!)
  return out
}

/** Country outline, CW, closed. Coast ~6 km offshore. */
export const GEORGIA_BORDER: [number, number][] = [
  [41.47841, 41.5097],
  [41.54, 41.64],
  [41.63, 41.73],
  [41.68, 41.82],
  [41.75, 41.99],
  [41.56, 42.15],
  [41.47, 42.28],
  [41.46, 42.4],
  [41.38, 42.62],
  [41.37522, 42.66177],
  [41.16, 42.85],
  [40.9, 43.01],
  [40.5, 43.11],
  [40.2, 43.33],
  [40.02, 43.39],
  [40.25, 43.52],
  [40.7, 43.56],
  [40.84933, 43.41521],
  [41.55, 43.38],
  [42.33512, 43.27404],
  [42.85, 43.18],
  [43.4, 42.98],
  [43.78931, 42.81357],
  [43.99279, 42.60603],
  [44.60941, 42.74731],
  [45.2, 42.62],
  [45.54938, 42.51472],
  [45.85631, 42.08839],
  [46.48438, 41.85116],
  [46.22411, 41.70833],
  [46.71392, 41.15673],
  [46.57636, 41.03588],
  [46.03577, 41.09153],
  [45.28992, 41.37762],
  [45.03935, 41.20422],
  [44.2, 41.12],
  [43.58782, 41.0123],
  [42.9, 41.28],
  [42.55399, 41.53732],
  [41.9, 41.49],
  [41.47841, 41.5097],
]

/** Mask hole = border + 50 km so neighbors/sea stay in frame. */
export const GEORGIA_HOLE: [number, number][] = bufferRingKm(GEORGIA_BORDER, GEORGIA_HALO_KM)

export const GEORGIA_MASK_SOURCE = 'sivrce-georgia-mask'
export const GEORGIA_MASK_LAYER = 'sivrce-georgia-mask-fill'
/** geojson-vt default 18 tessellates a world-hole at street z and never finishes. */
export const GEORGIA_MASK_MAXZOOM = 8

const MASK_OUTER = { w: 20, s: 30, e: 60, n: 55 } as const

function ringBbox(ring: [number, number][]) {
  let w = 180
  let s = 90
  let e = -180
  let n = -90
  for (const [lng, lat] of ring) {
    if (lng < w) w = lng
    if (lng > e) e = lng
    if (lat < s) s = lat
    if (lat > n) n = lat
  }
  return { w, s, e, n }
}

function maskSlab(west: number, south: number, east: number, north: number): GeoJSON.Feature {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ],
      ],
    },
  }
}

/** Four slabs around the halo bbox — no hole, so geojson-vt cannot hang or eat the window. */
export const GEORGIA_MASK_FC: GeoJSON.FeatureCollection = (() => {
  const inner = ringBbox(GEORGIA_HOLE)
  return {
    type: 'FeatureCollection',
    features: [
      maskSlab(MASK_OUTER.w, MASK_OUTER.s, inner.w, MASK_OUTER.n),
      maskSlab(inner.e, MASK_OUTER.s, MASK_OUTER.e, MASK_OUTER.n),
      maskSlab(inner.w, MASK_OUTER.s, inner.e, inner.s),
      maskSlab(inner.w, inner.n, inner.e, MASK_OUTER.n),
    ],
  }
})()
export const MAP_BRAND_WATER = BRAND.colors.navySoft
export const MAP_BRAND_LAND = BRAND.colors.navy
