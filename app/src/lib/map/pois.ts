/**
 * Map amenity POIs — static OSM export (scripts/fetch-pois.ts).
 * ponytail: committed JSON; no runtime Overpass. Colors from locked CATEGORY_BRAND.
 */

import type { FilterSpecification } from 'maplibre-gl'
import raw from '@/data/tbilisi-pois.json'
import { BRAND } from '@/lib/brand'
import { CATEGORY_BRAND } from '@/lib/category-brand'

export const POI_CATEGORIES = [
  'metro',
  'pharmacy',
  'school',
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

/** Default: metro only — highest RE signal, least clutter. */
export const POI_DEFAULT_ON: readonly PoiCategory[] = ['metro']

export const POI_LABELS: Record<PoiCategory, string> = {
  metro: 'მეტრო',
  pharmacy: 'აფთიაქი',
  school: 'სკოლა',
  shop: 'მარკეტი',
  gym: 'სპორტდარბაზი',
  hospital: 'კლინიკა',
}

/** Locked category hues only — no new brand hex. */
export const POI_COLORS: Record<PoiCategory, string> = {
  metro: BRAND.colors.blue,
  pharmacy: CATEGORY_BRAND.dailyRent.hue,
  school: CATEGORY_BRAND.cottages.hue,
  shop: CATEGORY_BRAND.commercial.hue,
  gym: CATEGORY_BRAND.houses.hue,
  hospital: CATEGORY_BRAND.hotels.hue,
}

const CAT_SET = new Set<string>(POI_CATEGORIES)

export function isPoiCategory(v: string): v is PoiCategory {
  return CAT_SET.has(v)
}

export const MAP_POIS: MapPoi[] = (raw.pois as MapPoi[]).filter((p) =>
  isPoiCategory(p.category),
)

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

export function poiFilterSpec(enabled: readonly PoiCategory[]): FilterSpecification {
  if (enabled.length === 0) {
    return ['==', ['get', 'category'], '__none__']
  }
  return ['in', ['get', 'category'], ['literal', [...enabled]]]
}
