import { COUNTRY_IDS, MARKETS, isPathCountry, type MarketId, type PathCountryId } from '@/lib/markets'
import { FREEDOM_SQUARE } from '@/lib/map/map-geo'
import { cityByName, cityBySlug } from '@/lib/map/user-place.server'

/**
 * IP → launched market + map camera.
 * Humans hitting sivrce.com/ 302 to their country (or sivrce.ge).
 * Crawlers + ?worldwide=1 + cookie=global keep the directory hub.
 * Cookie also aims /map at the last opened country path.
 */

/** v2: v1 (`sv-geo-market`) auto-stamped `global` on hub fallback and trapped humans. */
export const GEO_COOKIE = 'sv-geo-v2'
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

/** Country hub, or `/{cc}/{city}` when the IP city is a launched city in that market. */
export function geoHomePath(id: GeoLaunchId, ipCity?: string | null): string {
  const prefix = MARKETS[id].pathPrefix
  if (!ipCity) return prefix
  let name = ipCity.trim()
  if (!name) return prefix
  try {
    name = decodeURIComponent(name)
  } catch {
    /* keep raw */
  }
  const hit = cityByName(name)
  const m = MARKETS[id]
  if (hit && hit.cc === m.countryCode && m.citySlugs.includes(hit.slug)) {
    return `${prefix}/${hit.slug}`
  }
  return prefix
}

export type GeoLaunchTarget = 'hub' | 'ge' | GeoLaunchId

/** Bot / AI crawlers must see the worldwide directory, not a geo 302. */
export function isCrawler(ua: string | null | undefined): boolean {
  if (!ua) return false
  return /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slurp|duckduckbot|applebot|semrush|ahrefsbot|mj12bot|dotbot|bytespider|gptbot|claudebot|anthropic|ccbot|petalbot|ia_archiver/i.test(
    ua,
  )
}

/**
 * Where sivrce.com/ should send this request.
 * Cookie wins (sticky + worldwide opt-out), then IP ISO, else hub.
 */
export function geoLaunchTarget(input: {
  cookie?: string | null
  iso?: string | null
  worldwide?: boolean
  crawler?: boolean
}): GeoLaunchTarget {
  if (input.worldwide || input.crawler) return 'hub'
  const cook = input.cookie?.trim() || null
  if (cook === 'global') return 'hub'
  if (cook === 'ge') return 'ge'
  if (isGeoLaunch(cook)) return cook
  const m = marketFromIso(input.iso)
  if (m === 'ge') return 'ge'
  if (m && isGeoLaunch(m)) return m
  return 'hub'
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
