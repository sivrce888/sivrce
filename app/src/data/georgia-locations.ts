/**
 * Georgia location catalog for filters + autocomplete.
 * Source: myhome.ge + ss.ge pickers (2026-07-18), OSM for Tbilisi streets.
 * SEO landing pages stay in seo-pages.ts (throttled); this file is the full picker.
 */
import data from './georgia-locations.json'
import tbilisiStreets from './tbilisi-streets.json'

export type GeoDistricts = {
  raions: Record<string, string[]>
  flat: string[]
}

type Catalog = {
  source: string
  cities: string[]
  municipalities: string[]
  districts: Record<string, GeoDistricts>
  streets: Record<string, string[]>
}

const GEO = data as Catalog

/** Popular + settlement cities (picker). Municipalities are separate. */
export const GEO_CITIES: string[] = GEO.cities
export const GEO_MUNICIPALITIES: string[] = GEO.municipalities

/** All city-level picks: cities first, then municipalities. */
export const GEO_ALL_PLACES: string[] = [...GEO.cities, ...GEO.municipalities]

export function geoDistrictsOf(city?: string): string[] {
  if (!city) {
    return [...new Set(Object.values(GEO.districts).flatMap((d) => d.flat))]
  }
  return GEO.districts[city]?.flat ?? []
}

export function geoRaionsOf(city: string): Record<string, string[]> {
  return GEO.districts[city]?.raions ?? {}
}

export type GeoStreet = { ka: string; en?: string; ru?: string; city: string }

/** Streets for suggest: OSM Tbilisi + competitor Batumi/Kutaisi/Rustavi. */
export function geoStreets(): GeoStreet[] {
  const out: GeoStreet[] = []
  for (const s of tbilisiStreets as { ka: string; en?: string; ru?: string }[]) {
    out.push({ ka: s.ka, en: s.en, ru: s.ru, city: 'თბილისი' })
  }
  for (const [city, names] of Object.entries(GEO.streets)) {
    for (const ka of names) out.push({ ka, city })
  }
  return out
}

export const GEO_SOURCE = GEO.source
