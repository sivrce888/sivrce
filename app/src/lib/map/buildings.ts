/**
 * Cluster listings into clickable "buildings" by proximity.
 * ponytail: ~60m grid — real Building3D footprints when DB rows exist.
 */

import type { DealType, Listing } from '@/data/listings'
import { DEAL_BRAND } from '@/lib/category-brand'
import { BRAND } from '@/lib/brand'

const CELL_DEG = 0.00055 // ≈ 60 m at Tbilisi lat

export type BuildingDealCounts = Record<DealType, number>

export type MapBuildingCluster = {
  id: string
  lat: number
  lng: number
  label: string
  district: string
  listings: Listing[]
  counts: BuildingDealCounts
  /** Dominant deal for pin / extrusion color */
  dominant: DealType
  color: string
  /** Extrusion height in meters (visual only) */
  heightM: number
}

export function dealColor(deal: DealType): string {
  switch (deal) {
    case 'sale':
      return DEAL_BRAND.sale
    case 'rent':
      return DEAL_BRAND.rent
    case 'daily':
      return DEAL_BRAND.daily
    default: {
      const _exhaustive: never = deal
      return _exhaustive
    }
  }
}

function cellKey(lat: number, lng: number): string {
  const y = Math.round(lat / CELL_DEG)
  const x = Math.round(lng / CELL_DEG)
  return `${y}:${x}`
}

function dominantDeal(counts: BuildingDealCounts): DealType {
  const order: DealType[] = ['sale', 'rent', 'daily']
  let best: DealType = 'sale'
  let n = -1
  for (const d of order) {
    if (counts[d] > n) {
      n = counts[d]
      best = d
    }
  }
  return best
}

/** Group listings that share ~60m grid cells into building clusters. */
export function clusterListingsToBuildings(listings: Listing[]): MapBuildingCluster[] {
  const buckets = new Map<string, Listing[]>()

  for (const l of listings) {
    const key = cellKey(l.coords.lat, l.coords.lng)
    const arr = buckets.get(key)
    if (arr) arr.push(l)
    else buckets.set(key, [l])
  }

  const out: MapBuildingCluster[] = []
  for (const [key, items] of buckets) {
    const lat = items.reduce((s, l) => s + l.coords.lat, 0) / items.length
    const lng = items.reduce((s, l) => s + l.coords.lng, 0) / items.length
    const counts: BuildingDealCounts = { sale: 0, rent: 0, daily: 0 }
    for (const l of items) counts[l.dealType]++
    const dominant = dominantDeal(counts)
    const maxFloors = Math.max(...items.map((l) => l.totalFloors || l.floor || 4), 4)
    const label = items[0]!.address.split(',')[0]!.trim()
    out.push({
      id: `b-${key}`,
      lat,
      lng,
      label,
      district: items[0]!.district,
      listings: items,
      counts,
      dominant,
      color: dealColor(dominant),
      heightM: Math.min(12 + maxFloors * 3.2 + items.length * 1.5, 90),
    })
  }
  return out.sort((a, b) => b.listings.length - a.listings.length)
}

/** ~12m square footprint for fill-extrusion (visual proxy for a building). */
export function buildingFootprint(lat: number, lng: number, halfM = 14): GeoJSON.Polygon {
  const dLat = halfM / 111_320
  const dLng = halfM / (111_320 * Math.cos((lat * Math.PI) / 180))
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ],
    ],
  }
}

export function buildingsToGeoJSON(buildings: MapBuildingCluster[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: buildings.map((b) => ({
      type: 'Feature' as const,
      id: b.id,
      properties: {
        id: b.id,
        label: b.label,
        district: b.district,
        color: b.color,
        height: b.heightM,
        sale: b.counts.sale,
        rent: b.counts.rent,
        daily: b.counts.daily,
        total: b.listings.length,
        dominant: b.dominant,
      },
      geometry: buildingFootprint(b.lat, b.lng),
    })),
  }
}

export const MAP_CENTER = { lat: 41.7151, lng: 44.8271 } as const
export const MAP_BRAND_WATER = BRAND.colors.navySoft
export const MAP_BRAND_LAND = BRAND.colors.navy
