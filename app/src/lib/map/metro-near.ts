/**
 * Nearest-metro resolution — client-safe plane.
 *
 * Split out of lib/map/pois because ListingCard's metro chip lazy-imported that
 * module and pulled the 869 KB georgia-pois.json (142 KB gzip) into the browser
 * on every listing surface. Everything the chip needs is the 22 KB walking grid
 * plus the 22 curated stations, so this module is ~30 KB and pois.ts re-exports
 * it (one implementation, server and client).
 */

import { METRO_STATIONS as TBILISI_METRO } from '@/data/tbilisi-metro'
import gridRaw from '@/data/tbilisi-metro-grid.json'
import { METRO_MAX_CATCHMENT_M } from '@/lib/geo/nearest-poi-constants'
import type { NearMetro } from './metro-format'

export { formatMetroDist, type NearMetro } from './metro-format'

/** Beyond this, hide the metro chip (not Tbilisi catchment). */
const METRO_MAX_SHOW_M = METRO_MAX_CATCHMENT_M

/** Chip shows walking-nearest up to this — road km run ~2x straight km in pockets. */
const METRO_ROAD_MAX_M = 5000

const METRO_GRID = gridRaw as {
  lat0: number
  lng0: number
  step: number
  nLat: number
  nLng: number
  stations: string[]
  cells: number[]
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const toR = Math.PI / 180
  const dLat = (lat2 - lat1) * toR
  const dLng = (lng2 - lng1) * toR
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Precomputed walking distance to nearest metro for this cell, or null.
 * ponytail: ~400 m cells from scripts/fetch-metro-grid.mjs (Valhalla pedestrian);
 * rerun that script when OSM paths change. Straight-line haversine covers misses. */
function gridWalkMetro(lat: number, lng: number): { name: string; meters: number } | null {
  const g = METRO_GRID
  const c = Math.round((lng - g.lng0) / g.step)
  const r = Math.round((lat - g.lat0) / g.step)
  if (c < 0 || r < 0 || c >= g.nLng || r >= g.nLat) return null
  const v = g.cells[r * g.nLng + c]
  if (v < 0) return null
  return { name: g.stations[Math.floor(v / 100000)], meters: v % 100000 }
}

/** Nearest metro by walking route where the grid covers, else straight-line; null if far. */
export function nearestMetro(lat: number, lng: number): NearMetro | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const g = gridWalkMetro(lat, lng)
  if (g && g.meters <= METRO_ROAD_MAX_M) {
    return { name: g.name, meters: g.meters, walkMin: Math.max(1, Math.round(g.meters / 80)) }
  }
  let bestName = ''
  let bestM = Infinity
  for (const s of TBILISI_METRO) {
    const m = haversineM(lat, lng, s.lat, s.lng)
    if (m < bestM) {
      bestM = m
      bestName = s.ka
    }
  }
  if (!bestName || bestM > METRO_MAX_SHOW_M) return null
  const meters = Math.round(bestM)
  return { name: bestName, meters, walkMin: Math.max(1, Math.round(meters / 80)) }
}

/** Meters for Meili filter; far listings get a large sentinel. */
export function metroMeters(lat: number, lng: number): number {
  return nearestMetro(lat, lng)?.meters ?? 999_999
}
