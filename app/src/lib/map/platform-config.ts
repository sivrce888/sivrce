/**
 * Runtime map / OSM platform knobs from SystemConfig (+ env fallback for floor stacks).
 * Server pages pass this into Map3D so admin changes apply without rebuild.
 */

import { getAllConfig, type ConfigValues } from "@/lib/config"
import type { MapTerrain } from "@/lib/map/floorLayers"
import { FLOOR_STACKS_ENV } from "@/lib/map/floors"

export type MapPlatformConfig = {
  floorStacksEnabled: boolean
  satelliteEnabled: boolean
  defaultTerrain: MapTerrain
  defaultView3d: boolean
  center: { lat: number; lng: number }
  minZoom: number
  detailZoom: number
  priceMinZoom: number
  clusterMaxZoom: number
  styleUrlLight: string
  styleUrlClean: string
  styleUrlDark: string
  jsonCacheVer: string
  geocodeEnabled: boolean
}

export function mapPlatformFromConfig(c: ConfigValues): MapPlatformConfig {
  return {
    // Env OR admin — either switch turns stacks on (owner can force via env in prod).
    floorStacksEnabled: FLOOR_STACKS_ENV || c["map.floorStacksEnabled"],
    satelliteEnabled: c["map.satelliteEnabled"],
    defaultTerrain: c["map.defaultTerrain"],
    defaultView3d: c["map.defaultView3d"],
    center: { lat: c["map.centerLat"], lng: c["map.centerLng"] },
    minZoom: c["map.minZoom"],
    detailZoom: c["map.detailZoom"],
    priceMinZoom: c["map.priceMinZoom"],
    clusterMaxZoom: c["map.clusterMaxZoom"],
    styleUrlLight: c["map.styleUrlLight"],
    styleUrlClean: c["map.styleUrlClean"],
    styleUrlDark: c["map.styleUrlDark"],
    jsonCacheVer: c["map.jsonCacheVer"],
    geocodeEnabled: c["map.geocodeEnabled"],
  }
}

export async function getMapPlatformConfig(): Promise<MapPlatformConfig> {
  return mapPlatformFromConfig(await getAllConfig())
}
