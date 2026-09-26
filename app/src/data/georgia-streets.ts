/**
 * Competitor + OSM city streets — split out of georgia-locations so client bundles
 * (pickers, search UI) don't pay for them; the only consumers are /api/suggest
 * and the /locations/{city}/{street} SEO pages (both server-only).
 * Refresh: `python3 scripts/sync-competitor-locations.py` +
 * `python3 scripts/sync-georgia-streets-osm.py`
 */
import data from './georgia-streets.json'
import { toLatin } from '@/lib/ka-latin'

export type GeoStreet = { ka: string; en?: string; ru?: string; city: string }
export type GeoStreetSlug = { ka: string; slug: string }

const STREETS = data.streets as Record<string, string[]>

/** City street names from the competitor + OSM catalog (not Tbilisi OSM). */
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

const slugify = (ka: string): string =>
  toLatin(ka).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/**
 * Slug index per city, memoized lazily — only the city a page request touches
 * pays for transliteration. Deterministic: the catalog is ka-sorted, collisions
 * get -N suffixes in first-seen order.
 */
const SLUG_INDEX = new Map<string, GeoStreetSlug[]>()

export function geoStreetsWithSlugs(city: string): GeoStreetSlug[] {
  let rows = SLUG_INDEX.get(city)
  if (rows) return rows
  rows = []
  const seen = new Map<string, number>()
  for (const ka of geoStreetsOf(city)) {
    const base = slugify(ka) || 'kucha'
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    rows.push({ ka, slug: n === 0 ? base : `${base}-${n + 1}` })
  }
  SLUG_INDEX.set(city, rows)
  return rows
}

/** Resolve a /locations/{city}/{street} slug back to the ka street name. */
export function geoStreetBySlug(city: string, slug: string): string | null {
  return geoStreetsWithSlugs(city).find((s) => s.slug === slug)?.ka ?? null
}
