/**
 * AUTO-GENERATED: GeoNames cities15000 -> MAP_CITIES extension
 * Run: node scripts/import-geonames-cities.mjs
 * DO NOT EDIT BY HAND - regenerate instead.
 */

import raw from './user-place.gen.json'

export type MapCityCc = string

export type MapCity = {
  slug: string
  ka: string
  en: string
  lat: number
  lng: number
  cc: MapCityCc
}

type Row = [slug: string, en: string, lat: number, lng: number, cc: string]

/** GeoNames cities (population > 15k or admin seats). ka=en; hubs live in user-place.ts. */
export const GEONAMES_CITIES: MapCity[] = (raw as Row[]).map(([slug, en, lat, lng, cc]) => ({
  slug, ka: en, en, lat, lng, cc,
}))

/** Merge with inventory + WORLD_PLACES (inventory wins on slug clash). */
export function buildMapCities(inventory: readonly MapCity[]): MapCity[] {
  const seen = new Set(inventory.map(c => c.slug))
  return [
    ...inventory,
    ...GEONAMES_CITIES.filter(c => !seen.has(c.slug))
  ]
}
