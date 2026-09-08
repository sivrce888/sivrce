/**
 * Competitor city streets — split out of georgia-locations so client bundles
 * (pickers, search UI) don't pay for them; the only consumer is /api/suggest.
 * Refresh: `python3 scripts/sync-competitor-locations.py`
 */
import data from './georgia-streets.json'

export type GeoStreet = { ka: string; en?: string; ru?: string; city: string }

const STREETS = data.streets as Record<string, string[]>

/** City street names from the competitor catalog (not Tbilisi OSM). */
export function geoStreetsOf(city: string): string[] {
  return STREETS[city] ?? []
}

/** Competitor city streets for /api/suggest. OSM Tbilisi stays in tbilisi-streets.ts (server-only). */
export function geoStreets(): GeoStreet[] {
  const out: GeoStreet[] = []
  for (const [city, names] of Object.entries(STREETS)) {
    for (const ka of names) out.push({ ka, city })
  }
  return out
}
