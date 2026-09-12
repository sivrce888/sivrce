/**
 * Server-only city plane: GeoNames corpus (22k) merged over the client list.
 * Import ONLY from routes/RSC — importing this from a client component ships
 * ~2 MB of city literals to the browser (device-budget lock violation).
 */

import { buildMapCities } from '@/data/user-place.gen'
import {
  MAP_CITIES,
  SNAP_MAX_KM,
  cityByNameIn,
  cityBySlugIn,
  nearestIn,
  placeFromIpIn,
  type MapCity,
} from '@/lib/map/user-place'

export type { MapCity } from '@/lib/map/user-place'

/** Full corpus — inventory/world places win on slug clash. */
export const MAP_CITIES_ALL: readonly MapCity[] = buildMapCities(MAP_CITIES)

export function nearestMapCity(
  lat: number,
  lng: number,
  maxKm = SNAP_MAX_KM,
): MapCity | null {
  return nearestIn(MAP_CITIES_ALL, lat, lng, maxKm)
}

export function cityBySlug(slug: string): MapCity | null {
  return cityBySlugIn(MAP_CITIES_ALL, slug)
}

export function cityByName(raw: string): MapCity | null {
  return cityByNameIn(MAP_CITIES_ALL, raw)
}

export function placeFromIp(lat: number, lng: number, cityName?: string | null): MapCity | null {
  return placeFromIpIn(MAP_CITIES_ALL, lat, lng, cityName)
}
