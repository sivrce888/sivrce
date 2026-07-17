/**
 * SIVRCE map intelligence — address + building# + coords clustering.
 *
 * Algorithm (ponytail, world-class enough for MVP scale):
 *  1. Parse street + buildingNumber from address (or explicit fields)
 *  2. Cluster by normalize(street)|buildingNumber — same door = same tower
 *  3. Grid fallback (~60m) when address is missing/ambiguous
 *  4. Attach construction developments as ghost 3D extrusions (not yet built)
 *  5. Click-anywhere: nearest cluster within RADIUS_M (haversine)
 *
 * Ceiling: O(n) cluster + O(n) nearest. Upgrade → PostGIS ST_DWithin when DB-backed.
 */

import type { DealType, Listing } from '@/data/listings'
import { DEAL_BRAND, CATEGORY_BRAND } from '@/lib/category-brand'
import { BRAND } from '@/lib/brand'
import type { Project } from '@/data/professionals'

const CELL_DEG = 0.00055 // ≈ 60 m at Tbilisi lat
export const NEAREST_RADIUS_M = 90

export type BuildingStatus = 'active' | 'construction' | 'ready'
export type BuildingDealCounts = Record<DealType, number>

export type MapBuildingCluster = {
  id: string
  lat: number
  lng: number
  label: string
  address: string
  buildingNumber: string
  district: string
  city: string
  listings: Listing[]
  counts: BuildingDealCounts
  dominant: DealType | 'construction'
  color: string
  heightM: number
  status: BuildingStatus
  /** 0–100 construction progress (developments) */
  progress?: number
  projectSlug?: string
  finish?: string
}

export type MapDealFilter = DealType | 'all'
export type MapStatusFilter = 'all' | 'active' | 'construction'

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

/** Extract building number from Georgian/Latin street address. */
export function parseBuildingNumber(address: string): string {
  const head = address.split(',')[0] ?? address
  const m = head.match(/(\d+[a-zA-Zა-ჰ]?)\s*$/)
  return m?.[1] ?? ''
}

export function parseStreet(address: string): string {
  const head = (address.split(',')[0] ?? address).trim()
  return head.replace(/\s*\d+[a-zA-Zა-ჰ]?\s*$/, '').trim().toLowerCase()
}

export function listingBuildingNumber(l: Listing): string {
  return l.buildingNumber?.trim() || parseBuildingNumber(l.address)
}

function normalizeKey(street: string, buildingNumber: string): string {
  return `${street}|${buildingNumber}`.replace(/\s+/g, ' ')
}

function cellKey(lat: number, lng: number): string {
  return `${Math.round(lat / CELL_DEG)}:${Math.round(lng / CELL_DEG)}`
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

export function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000
  const toR = (d: number) => (d * Math.PI) / 180
  const dLat = toR(bLat - aLat)
  const dLng = toR(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

function isValidCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

/** Group listings by address+building# (primary) or ~60m grid (fallback). */
export function clusterListingsToBuildings(listings: Listing[]): MapBuildingCluster[] {
  const buckets = new Map<string, Listing[]>()

  for (const l of listings) {
    if (!isValidCoords(l.coords.lat, l.coords.lng)) continue
    const bn = listingBuildingNumber(l)
    const street = parseStreet(l.address)
    const key =
      street && bn
        ? `addr:${normalizeKey(street, bn)}`
        : `grid:${cellKey(l.coords.lat, l.coords.lng)}`
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
    const first = items[0]!
    const bn = listingBuildingNumber(first)
    const streetLabel = (first.address.split(',')[0] ?? first.address).trim()
    out.push({
      id: `b-${key}`,
      lat,
      lng,
      label: streetLabel,
      address: first.address,
      buildingNumber: bn,
      district: first.district,
      city: first.city,
      listings: items,
      counts,
      dominant,
      color: dealColor(dominant),
      heightM: Math.min(12 + maxFloors * 3.2 + items.length * 1.5, 90),
      status: 'active',
    })
  }
  return out.sort((a, b) => b.listings.length - a.listings.length)
}

/** Unbuilt / ongoing developments as clickable 3D ghosts. */
export function projectsToConstructionBuildings(
  projects: Array<Project & { coords: { lat: number; lng: number }; floors?: number }>,
): MapBuildingCluster[] {
  return projects
    .filter((p) => p.done < 100 && isValidCoords(p.coords.lat, p.coords.lng))
    .map((p) => {
      const floors = p.floors ?? Math.max(8, Math.round(p.flats / 12))
      const bn = parseBuildingNumber(p.location) || '—'
      return {
        id: `dev-${p.slug}`,
        lat: p.coords.lat,
        lng: p.coords.lng,
        label: p.name,
        address: p.location,
        buildingNumber: bn,
        district: p.location.split(',')[0]?.trim() ?? p.city,
        city: p.city,
        listings: [],
        counts: { sale: 0, rent: 0, daily: 0 },
        dominant: 'construction' as const,
        color: CATEGORY_BRAND.newProjects.hue,
        heightM: Math.min(18 + floors * 3.1 * (p.done / 100 || 0.35), 110),
        status: 'construction' as const,
        progress: p.done,
        projectSlug: p.slug,
        finish: p.finish,
      }
    })
}

export function mergeMapBuildings(
  listings: MapBuildingCluster[],
  developments: MapBuildingCluster[],
): MapBuildingCluster[] {
  return [...listings, ...developments]
}

export function filterBuildings(
  buildings: MapBuildingCluster[],
  deal: MapDealFilter,
  status: MapStatusFilter,
): MapBuildingCluster[] {
  return buildings.filter((b) => {
    if (status === 'construction' && b.status !== 'construction') return false
    if (status === 'active' && b.status === 'construction') return false
    if (deal === 'all') return true
    if (b.status === 'construction') return status !== 'active'
    return b.counts[deal] > 0
  })
}

/** Nearest building within radius — powers click-anywhere on the map. */
export function findNearestBuilding(
  lat: number,
  lng: number,
  buildings: MapBuildingCluster[],
  radiusM = NEAREST_RADIUS_M,
): MapBuildingCluster | null {
  let best: MapBuildingCluster | null = null
  let bestD = radiusM
  for (const b of buildings) {
    const d = haversineM(lat, lng, b.lat, b.lng)
    if (d <= bestD) {
      bestD = d
      best = b
    }
  }
  return best
}

export function buildingFootprint(
  lat: number,
  lng: number,
  halfM = 14,
): GeoJSON.Polygon {
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
        address: b.address,
        buildingNumber: b.buildingNumber,
        district: b.district,
        color: b.color,
        height: b.heightM,
        sale: b.counts.sale,
        rent: b.counts.rent,
        daily: b.counts.daily,
        total: b.listings.length,
        dominant: b.dominant,
        status: b.status,
        progress: b.progress ?? 100,
        opacity: b.status === 'construction' ? 0.55 : 0.92,
      },
      geometry: buildingFootprint(b.lat, b.lng, b.status === 'construction' ? 18 : 14),
    })),
  }
}

export const MAP_CENTER = { lat: 41.7151, lng: 44.8271 } as const
export const MAP_BRAND_WATER = BRAND.colors.navySoft
export const MAP_BRAND_LAND = BRAND.colors.navy
