import { COUNTRY_IDS, MARKETS, isPathCountry, type MarketId, type PathCountryId } from '@/lib/markets'
import { FREEDOM_SQUARE } from '@/lib/map/map-geo'
import { cityBySlug } from '@/lib/map/user-place'

/**
 * IP → launched market + map camera.
 * sivrce.com/ is always the international hub — no geo-bounce of /.
 * Cookie aims /map at the last opened country path.
 */

export const GEO_COOKIE = 'sv-geo-market'
export const GEO_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

export const GEO_LAUNCH = COUNTRY_IDS
export type GeoLaunchId = PathCountryId

export function isGeoLaunch(v: string | null | undefined): v is GeoLaunchId {
  return !!v && isPathCountry(v)
}

const ISO_MARKET: Record<string, MarketId> = { GE: 'ge' }
for (const id of COUNTRY_IDS) {
  const cc = MARKETS[id].countryCode
  if (cc) ISO_MARKET[cc] = id
}

export function marketFromIso(iso: string | null | undefined): MarketId | null {
  if (!iso) return null
  return ISO_MARKET[iso.trim().toUpperCase()] ?? null
}

export function geoHomePath(id: GeoLaunchId): string {
  return MARKETS[id].pathPrefix
}

export function marketCenter(market: MarketId): { lat: number; lng: number; slug: string } {
  if (market === 'ge' || market === 'global') {
    return { lat: FREEDOM_SQUARE.lat, lng: FREEDOM_SQUARE.lng, slug: 'tbilisi' }
  }
  const slug = MARKETS[market].defaultCitySlug
  const pin = cityBySlug(slug)
  if (pin) return { lat: pin.lat, lng: pin.lng, slug }
  return { lat: FREEDOM_SQUARE.lat, lng: FREEDOM_SQUARE.lng, slug }
}
