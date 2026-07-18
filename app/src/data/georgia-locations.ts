/**
 * Georgia location catalog for filters + autocomplete.
 * Tbilisi raions: official 10 (matsne 2014). Cities/streets: myhome + ss + OSM.
 * SEO landing pages stay in seo-pages.ts; this file is the full picker.
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

function collectDistricts(d: GeoDistricts): string[] {
  // ponytail: derive from raions so flat can't drift into duplicate/combined names
  const names = [
    ...Object.keys(d.raions),
    ...Object.values(d.raions).flat(),
    ...d.flat,
  ]
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'ka'))
}

export function geoDistrictsOf(city?: string): string[] {
  if (!city) {
    return [...new Set(Object.values(GEO.districts).flatMap(collectDistricts))]
  }
  const d = GEO.districts[city]
  return d ? collectDistricts(d) : []
}

/** Official raion → უბანი map (empty for cities without raion split). */
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
