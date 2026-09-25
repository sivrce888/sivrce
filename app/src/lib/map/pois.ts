/**
 * Map amenity POIs — OSM export for Tbilisi + Batumi + Kutaisi (scripts/fetch-pois.ts).
 * ponytail: committed JSON; no runtime Overpass. Colors from locked CATEGORY_BRAND.
 */

import raw from '@/data/georgia-pois.json'
import { METRO_NEAR_M } from '@/lib/geo/nearest-poi-constants'
import {
  POI_COLORS,
  POI_LABELS,
  isPoiCategory,
  type PoiCategory,
} from './poi-constants'

export { METRO_NEAR_M }
// Client-safe constants (filters, colors, prefs) live in poi-constants —
export {
  POI_CATEGORIES,
  POI_COLORS,
  POI_DEFAULT_ON,
  POI_LABELS,
  POI_MIN_ZOOM,
  isPoiCategory,
  parsePoiPrefs,
  poiFilterSpec,
  serializePoiPrefs,
  type PoiCategory,
} from './poi-constants'

export type MapPoi = {
  id: string
  category: PoiCategory
  name: string
  lat: number
  lng: number
}

/**
 * Drop OSM college/faculty noise tagged as university/college.
 * Keep named HE institutions (uni / academy / college / institute).
 */
export function keepUniversityPoi(name: string): boolean {
  const n = name.trim()
  if (!n) return false
  const he =
    /უნივერსიტეტ|university|აკადემი|academy|კონსერვატორ|კოლეჯ|college|ინსტიტუტ|institute|უნი|თსუ|თსსუ|\bTSU\b|\bGTU\b|\bISU\b|ილიაუნი|ილიას/i
  if (/ფაკულტეტ/i.test(n) && !he.test(n)) return false
  if (/(სკოლა|school|kindergarten)/i.test(n) && !he.test(n)) return false
  return he.test(n)
}

export const MAP_POIS: MapPoi[] = (raw.pois as MapPoi[]).filter((p) => {
  if (!isPoiCategory(p.category)) return false
  if (p.category === 'university') return keepUniversityPoi(p.name)
  return true
})

export const METRO_STATIONS: MapPoi[] = MAP_POIS.filter((p) => p.category === 'metro')

// Client-safe formatting lives in metro-format (this module ships 1.1 MB JSON).
export { formatMetroDist, type NearMetro } from './metro-format'
// Single nearest-metro implementation — client-safe plane (grid + 22 stations).
export { metroMeters, nearestMetro } from './metro-near'
import { nearestMetro } from './metro-near'

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

export type NearAmenity = {
  category: PoiCategory
  name: string
  meters: number
  walkMin: number
}

/** Catchments for building-page “როგორ მივიდე” — metro uses the walking grid instead.
 *  bus/rail catchments cover walk-score's transit band (≤1000 m); kindergarten/bank
 *  cover the walk band (≤600 m scores, wider still informs the chip). */
const AMENITY_MAX_M: Partial<Record<PoiCategory, number>> = {
  bus: 1000,
  rail: 1200,
  school: 1500,
  kindergarten: 900,
  bank: 700,
  park: 1200,
  hospital: 2500,
  shop: 800,
  university: 2500,
  gym: 1200,
  pharmacy: 700,
  landmark: 1500,
}

/** Nearest amenity per category within catchment. Empty outside POI cities. */
export function nearestAmenities(lat: number, lng: number): NearAmenity[] {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || MAP_POIS.length === 0) return []
  const best = new Map<PoiCategory, NearAmenity>()
  for (const p of MAP_POIS) {
    if (p.category === 'metro') continue // metro goes through the walking grid
    const max = AMENITY_MAX_M[p.category]
    if (max == null) continue
    const m = haversineM(lat, lng, p.lat, p.lng)
    if (m > max) continue
    const prev = best.get(p.category)
    if (prev && prev.meters <= m) continue
    const meters = Math.round(m)
    best.set(p.category, {
      category: p.category,
      name: p.name,
      meters,
      walkMin: Math.max(1, Math.round(meters / 80)),
    })
  }
  const metro = nearestMetro(lat, lng)
  if (metro) {
    best.set('metro', { category: 'metro', name: metro.name, meters: metro.meters, walkMin: metro.walkMin })
  }
  return [...best.values()].sort((a, b) => a.meters - b.meters)
}

export function poisToGeoJSON(
  pois: MapPoi[] = MAP_POIS,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pois.map((p) => ({
      type: 'Feature' as const,
      id: p.id,
      properties: {
        id: p.id,
        category: p.category,
        name: p.name,
        color: POI_COLORS[p.category],
        label: POI_LABELS[p.category],
        icon: `sv-poi-${p.category}`,
      },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  }
}
