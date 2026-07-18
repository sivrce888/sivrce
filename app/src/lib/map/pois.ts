/**
 * Map amenity POIs — static OSM export (scripts/fetch-pois.ts).
 * ponytail: committed JSON; no runtime Overpass. Colors from locked CATEGORY_BRAND.
 */

import type { FilterSpecification } from 'maplibre-gl'
import raw from '@/data/tbilisi-pois.json'
import { BRAND } from '@/lib/brand'
import { CATEGORY_BRAND } from '@/lib/category-brand'
import {
  METRO_MAX_CATCHMENT_M,
  METRO_NEAR_M,
} from '@/lib/geo/nearest-poi-constants'

export { METRO_NEAR_M }

export const POI_CATEGORIES = [
  'metro',
  'pharmacy',
  'school',
  'university',
  'park',
  'shop',
  'gym',
  'hospital',
] as const

export type PoiCategory = (typeof POI_CATEGORIES)[number]

export type MapPoi = {
  id: string
  category: PoiCategory
  name: string
  lat: number
  lng: number
}

/** Beyond this, hide metro chip (not Tbilisi catchment). */
const METRO_MAX_SHOW_M = METRO_MAX_CATCHMENT_M

/** Default: metro only — highest RE signal, least clutter. */
export const POI_DEFAULT_ON: readonly PoiCategory[] = ['metro']

/** Dense OSM cats appear later — less clutter when toggled on. */
export const POI_MIN_ZOOM: Record<PoiCategory, number> = {
  metro: 11,
  university: 11.5,
  hospital: 12,
  shop: 12,
  park: 12,
  gym: 12.5,
  school: 13,
  pharmacy: 13.5,
}

/** Fallback KA labels — UI prefers i18n `map.poi.*`. */
export const POI_LABELS: Record<PoiCategory, string> = {
  metro: 'მეტრო',
  pharmacy: 'აფთიაქი',
  school: 'სკოლა',
  university: 'უნივერსიტეტი',
  park: 'პარკი',
  shop: 'მარკეტი',
  gym: 'სპორტდარბაზი',
  hospital: 'კლინიკა',
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

/** Locked category hues only — no new brand hex. */
export const POI_COLORS: Record<PoiCategory, string> = {
  metro: BRAND.colors.blue,
  pharmacy: CATEGORY_BRAND.dailyRent.hue,
  school: CATEGORY_BRAND.newProjects.hue,
  university: CATEGORY_BRAND.land.hue,
  park: CATEGORY_BRAND.cottages.hue,
  shop: CATEGORY_BRAND.commercial.hue,
  gym: CATEGORY_BRAND.houses.hue,
  hospital: CATEGORY_BRAND.hotels.hue,
}

const CAT_SET = new Set<string>(POI_CATEGORIES)

export function isPoiCategory(v: string): v is PoiCategory {
  return CAT_SET.has(v)
}

export const MAP_POIS: MapPoi[] = (raw.pois as MapPoi[]).filter((p) => {
  if (!isPoiCategory(p.category)) return false
  if (p.category === 'university') return keepUniversityPoi(p.name)
  return true
})

export const METRO_STATIONS: MapPoi[] = MAP_POIS.filter((p) => p.category === 'metro')

export type NearMetro = {
  name: string
  meters: number
  walkMin: number
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

/** Nearest Tbilisi metro; null if far / no stations. */
export function nearestMetro(lat: number, lng: number): NearMetro | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || METRO_STATIONS.length === 0) {
    return null
  }
  let best: MapPoi | null = null
  let bestM = Infinity
  for (const s of METRO_STATIONS) {
    const m = haversineM(lat, lng, s.lat, s.lng)
    if (m < bestM) {
      bestM = m
      best = s
    }
  }
  if (!best || bestM > METRO_MAX_SHOW_M) return null
  const meters = Math.round(bestM)
  return {
    name: best.name,
    meters,
    walkMin: Math.max(1, Math.round(meters / 80)),
  }
}

/** Meters for Meili filter; far listings get a large sentinel. */
export function metroMeters(lat: number, lng: number): number {
  const n = nearestMetro(lat, lng)
  return n ? n.meters : 999_999
}

export function formatMetroDist(n: NearMetro): string {
  if (n.meters < 1000) return `${n.meters} m · ${n.walkMin} min`
  return `${(n.meters / 1000).toFixed(1)} km · ${n.walkMin} min`
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

/** Cookie/LS: comma list, e.g. "metro,pharmacy". Empty string = none. */
export function parsePoiPrefs(raw: unknown): PoiCategory[] | undefined {
  if (raw == null) return undefined
  if (typeof raw !== 'string') return undefined
  if (raw === '') return []
  const out: PoiCategory[] = []
  for (const part of raw.split(',')) {
    const t = part.trim()
    if (isPoiCategory(t) && !out.includes(t)) out.push(t)
  }
  return out
}

export function serializePoiPrefs(cats: readonly PoiCategory[]): string {
  return cats.join(',')
}

/** Zoom-aware: dense categories stay hidden until closer. */
export function poiFilterSpec(
  enabled: readonly PoiCategory[],
  zoom = 22,
): FilterSpecification {
  const visible = enabled.filter((c) => zoom + 1e-6 >= POI_MIN_ZOOM[c])
  if (visible.length === 0) {
    return ['==', ['get', 'category'], '__none__']
  }
  return ['in', ['get', 'category'], ['literal', [...visible]]]
}
