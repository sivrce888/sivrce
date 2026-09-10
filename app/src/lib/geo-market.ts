/**
 * IP → launched market + map camera.
 * ponytail: Vercel ISO header only. Cookie remembers a 302 so / stays shareable.
 * Thin FR/ES/… hubs stay unrouted until they have unique copy.
 */

import { BERLIN_CENTER, FREEDOM_SQUARE } from '@/lib/map/map-geo'
import { MARKETS, type MarketId } from '@/lib/markets'

export const GEO_COOKIE = 'sv-geo-market'
export const GEO_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

export const GEO_LAUNCH = ['de', 'ae'] as const
export type GeoLaunchId = (typeof GEO_LAUNCH)[number]

export function isGeoLaunch(v: string | null | undefined): v is GeoLaunchId {
  return v === 'de' || v === 'ae'
}

const ISO_MARKET: Record<string, MarketId> = {
  GE: 'ge',
  DE: 'de',
  AE: 'ae',
}

export function marketFromIso(iso: string | null | undefined): MarketId | null {
  if (!iso) return null
  return ISO_MARKET[iso.trim().toUpperCase()] ?? null
}

export function geoHomePath(id: GeoLaunchId): string {
  return MARKETS[id].pathPrefix
}

export function marketCenter(market: MarketId): { lat: number; lng: number; slug: string } {
  switch (market) {
    case 'de':
      return { lat: BERLIN_CENTER.lat, lng: BERLIN_CENTER.lng, slug: 'berlin' }
    case 'ae':
      return { lat: 25.2048, lng: 55.2708, slug: 'dubai' }
    case 'ge':
    case 'global':
      return { lat: FREEDOM_SQUARE.lat, lng: FREEDOM_SQUARE.lng, slug: 'tbilisi' }
    default: {
      const _n: never = market
      return _n
    }
  }
}
