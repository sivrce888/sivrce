/**
 * Georgia location catalog for filters + autocomplete.
 * Tbilisi raions: official 10 (matsne 2014). Cities: myhome + ss + OSM.
 * Refresh: `python3 scripts/sync-competitor-locations.py`
 * Streets live in georgia-streets.ts — server-only consumers (see suggest).
 */
import data from './georgia-locations.json'

export type GeoPickerGroup = { title: string; items: string[] }

export type GeoDistricts = {
  raions: Record<string, string[]>
  flat: string[]
  /** Display-only columns (myhome/ss layout). Titles are not catalog keys. */
  picker?: GeoPickerGroup[]
}

type Catalog = {
  source: string
  cities: string[]
  municipalities: string[]
  districts: Record<string, GeoDistricts>
  /** Official region → cities + municipalities (Geostat). Every name exactly once. */
  regions: Record<string, { cities: string[]; munis: string[] }>
}

const GEO = data as Catalog

/** Popular + settlement cities (picker). Municipalities are separate. */
export const GEO_CITIES: string[] = GEO.cities
export const GEO_MUNICIPALITIES: string[] = GEO.municipalities

/** Official regions (აჭარა, იმერეთი, …) in display order. */
export const GEO_REGIONS = GEO.regions
export type GeoRegion = (typeof GEO_REGIONS)[string]

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

/** Picker columns. Tbilisi: 5 cols, Didube+Old Tbilisi stacked. */
export function geoPickerColumns(city: string): GeoPickerGroup[][] {
  const groups = GEO.districts[city]?.picker ?? []
  if (city === 'თბილისი' && groups.length === 6) {
    return [
      [groups[0]!],
      [groups[1]!],
      [groups[2]!],
      [groups[3]!, groups[4]!],
      [groups[5]!],
    ]
  }
  return groups.map((g) => [g])
}

const CITY_SET = new Set(GEO.cities)

/** 'ახალციხის მუნიციპალიტეტი' → 'ახალციხე' (seat, nominative) so non-ka UI can
 *  say "Akhaltsikhe Municipality", not the romanized genitive. Genitive -ის
 *  drops a final ი/ა/ე and may syncopate (გარდაბნის ← გარდაბანი); -ო/-უ stay. */
export function geoMuniSeat(name: string): string | null {
  const m = /^(.+)ს (?:მუნიციპალიტეტი|რაიონი)$/.exec(name)
  if (!m) return null
  const gen = m[1]!
  const base = gen.endsWith('ი') ? gen.slice(0, -1) : gen
  const syn = (v: string) => `${base.slice(0, -1)}${v}${base.slice(-1)}ი`
  return [gen, `${base}ი`, `${base}ა`, `${base}ე`, syn('ა'), syn('ე')].find((c) => CITY_SET.has(c)) ?? null
}

export const GEO_SOURCE = GEO.source
