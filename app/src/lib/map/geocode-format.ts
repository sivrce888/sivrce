import { MAP_CITIES } from '@/lib/map/user-place'

/**
 * Client-safe geocode shapes. Leaf module — geocode.ts pulls ~1 MB of street and
 * quarter catalogs, so the map bundle imports from here, never from there.
 */

export type GeocodeHit = {
  lat: number
  lng: number
  label: string
  city?: string
  district?: string
  street?: string
  houseNo?: string
  /** OSM building outer ring [lng,lat]… when Nominatim returns polygon_geojson. */
  ring?: [number, number][]
}

/** UI line from a geocode hit — street + house № first. */
export function formatGeocodeAddress(
  hit: Pick<GeocodeHit, 'street' | 'houseNo' | 'district' | 'city' | 'label'>,
): string {
  const street = [hit.street, hit.houseNo].filter(Boolean).join(' ').trim()
  const line = [street || null, hit.district, hit.city].filter(Boolean).join(', ')
  return line || hit.label
}

/** Catalog pin only — unknown city must not snap to Tbilisi. */
export function knownCityCenter(city: string): { lat: number; lng: number } | null {
  const needle = city.trim().toLowerCase()
  if (!needle) return null
  const hit = MAP_CITIES.find(
    (c) => c.ka.toLowerCase() === needle || c.slug === needle || c.en.toLowerCase() === needle,
  )
  return hit ? { lat: hit.lat, lng: hit.lng } : null
}

/** "ჭავჭავაძის გამზ. 47" → street + houseNo (keeps casing). */
export function splitStreetHouse(raw: string): { street: string; houseNo: string } {
  const head = (raw.split(',')[0] ?? raw).trim()
  const m = head.match(/^(.*?)\s+(\d+[a-zA-Zა-ჰ]?)\s*$/u)
  if (!m?.[1] || !m[2]) return { street: head, houseNo: '' }
  return { street: m[1].trim(), houseNo: m[2] }
}
