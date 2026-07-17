/**
 * SIVRCE map intelligence — address + building# + landmark catalog.
 *
 * Algorithm (ponytail):
 *  1. Listings with buildingSlug → landmark cluster
 *  2. Remaining → street|number or ~60m grid
 *  3. Catalog landmarks with 0 listings still appear (SEO/map pins)
 *  4. Construction projects as ghosts (skip if already a catalog building)
 *  5. Click-anywhere: nearest within RADIUS_M
 *
 * Ceiling: O(n) cluster. Upgrade → PostGIS ST_DWithin when DB-backed.
 */

import type { DealType, Listing } from '@/data/listings'
import { BUILDINGS, type BuildingCatalogEntry } from '@/data/buildings'
import { DEAL_BRAND, CATEGORY_BRAND } from '@/lib/category-brand'
import { BRAND } from '@/lib/brand'
import { getDeveloper, type Project } from '@/data/professionals'
import footprintData from '@/data/building-footprints.json'

/** Real OSM building rings keyed by cluster id (© OpenStreetMap contributors, ODbL).
 *  null = confirmed no OSM coverage → square fallback. Refresh: npx tsx scripts/fetch-footprints.ts */
const FOOTPRINTS = footprintData.footprints as unknown as Record<
  string,
  { ring: [number, number][]; osmId: number } | null
>

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
  progress?: number
  projectSlug?: string
  finish?: string
  /** Landmark catalog */
  code?: string
  slug?: string
  img?: string
  developerSlug?: string
  developerName?: string
  rating?: number
  yearBuilt?: number
  floors?: number
  description?: string
}

export type MapDealFilter = DealType | 'all'
export type MapStatusFilter = 'all' | 'active' | 'construction'

function emptyCounts(): BuildingDealCounts {
  return { sale: 0, rent: 0, daily: 0, pledge: 0 }
}

export function dealColor(deal: DealType): string {
  switch (deal) {
    case 'sale':
      return DEAL_BRAND.sale
    case 'rent':
      return DEAL_BRAND.rent
    case 'daily':
      return DEAL_BRAND.daily
    case 'pledge':
      return DEAL_BRAND.pledge
    default: {
      const _exhaustive: never = deal
      return _exhaustive
    }
  }
}

export function dealLabelKa(deal: DealType): string {
  switch (deal) {
    case 'sale':
      return 'იყიდება'
    case 'rent':
      return 'ქირავდება'
    case 'daily':
      return 'დღიურად'
    case 'pledge':
      return 'გირავდება'
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
  const order: DealType[] = ['sale', 'rent', 'daily', 'pledge']
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

function countDeals(items: Listing[]): BuildingDealCounts {
  const counts = emptyCounts()
  for (const l of items) counts[l.dealType]++
  return counts
}

function enrichFromCatalog(
  cluster: MapBuildingCluster,
  cat: BuildingCatalogEntry,
): MapBuildingCluster {
  const dev = getDeveloper(cat.developerSlug)
  return {
    ...cluster,
    id: `bldg-${cat.slug}`,
    label: cat.name,
    address: cat.address,
    buildingNumber: cat.buildingNumber,
    district: cat.district,
    city: cat.city,
    lat: cat.coords.lat,
    lng: cat.coords.lng,
    code: cat.code,
    slug: cat.slug,
    img: cat.img,
    developerSlug: cat.developerSlug,
    developerName: dev?.name.ka,
    rating: cat.rating,
    yearBuilt: cat.yearBuilt,
    floors: cat.floors,
    description: cat.description.ka,
    projectSlug: cat.projectSlug ?? cluster.projectSlug,
    heightM: Math.min(18 + cat.floors * 3.1, 110),
    status: cat.status === 'construction' ? 'construction' : 'active',
  }
}

function catalogToCluster(cat: BuildingCatalogEntry, listings: Listing[]): MapBuildingCluster {
  const counts = countDeals(listings)
  const dominant = listings.length ? dominantDeal(counts) : ('sale' as DealType)
  const base: MapBuildingCluster = {
    id: `bldg-${cat.slug}`,
    lat: cat.coords.lat,
    lng: cat.coords.lng,
    label: cat.name,
    address: cat.address,
    buildingNumber: cat.buildingNumber,
    district: cat.district,
    city: cat.city,
    listings,
    counts,
    dominant: cat.status === 'construction' && listings.length === 0 ? 'construction' : dominant,
    color:
      cat.status === 'construction' && listings.length === 0
        ? CATEGORY_BRAND.newProjects.hue
        : dealColor(dominant),
    heightM: Math.min(18 + cat.floors * 3.1, 110),
    status: cat.status === 'construction' ? 'construction' : 'active',
    projectSlug: cat.projectSlug,
    progress: cat.status === 'construction' ? 55 : 100,
  }
  return enrichFromCatalog(base, cat)
}

/** Group listings by address+building# (primary) or ~60m grid (fallback). */
export function clusterListingsToBuildings(listings: Listing[]): MapBuildingCluster[] {
  const bySlug = new Map<string, Listing[]>()
  const rest: Listing[] = []

  for (const l of listings) {
    if (!isValidCoords(l.coords.lat, l.coords.lng)) continue
    if (l.buildingSlug) {
      const arr = bySlug.get(l.buildingSlug)
      if (arr) arr.push(l)
      else bySlug.set(l.buildingSlug, [l])
    } else {
      rest.push(l)
    }
  }

  const out: MapBuildingCluster[] = []
  const usedSlugs = new Set<string>()

  for (const cat of BUILDINGS) {
    const items = bySlug.get(cat.slug) ?? []
    usedSlugs.add(cat.slug)
    out.push(catalogToCluster(cat, items))
  }

  for (const [slug, items] of bySlug) {
    if (usedSlugs.has(slug)) continue
    const counts = countDeals(items)
    const dominant = dominantDeal(counts)
    const first = items[0]!
    const bn = listingBuildingNumber(first)
    out.push({
      id: `bldg-${slug}`,
      lat: items.reduce((s, l) => s + l.coords.lat, 0) / items.length,
      lng: items.reduce((s, l) => s + l.coords.lng, 0) / items.length,
      label: (first.address.split(',')[0] ?? first.address).trim(),
      address: first.address,
      buildingNumber: bn,
      district: first.district,
      city: first.city,
      listings: items,
      counts,
      dominant,
      color: dealColor(dominant),
      heightM: Math.min(12 + Math.max(...items.map((l) => l.totalFloors || 4)) * 3.2, 90),
      status: 'active',
      slug,
    })
  }

  const buckets = new Map<string, Listing[]>()
  for (const l of rest) {
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

  for (const [key, items] of buckets) {
    const lat = items.reduce((s, l) => s + l.coords.lat, 0) / items.length
    const lng = items.reduce((s, l) => s + l.coords.lng, 0) / items.length
    // Skip if too close to a catalog landmark (already covered)
    const nearCatalog = out.some(
      (b) => b.slug && haversineM(lat, lng, b.lat, b.lng) < 45,
    )
    if (nearCatalog) {
      const host = out.find((b) => b.slug && haversineM(lat, lng, b.lat, b.lng) < 45)
      if (host) {
        host.listings.push(...items)
        host.counts = countDeals(host.listings)
        host.dominant = dominantDeal(host.counts)
        host.color = dealColor(host.dominant)
      }
      continue
    }
    const counts = countDeals(items)
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
  const catalogProjectSlugs = new Set(
    BUILDINGS.map((b) => b.projectSlug).filter(Boolean) as string[],
  )
  return projects
    .filter(
      (p) =>
        p.done < 100 &&
        isValidCoords(p.coords.lat, p.coords.lng) &&
        !catalogProjectSlugs.has(p.slug),
    )
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
        counts: emptyCounts(),
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
    if (b.status === 'construction' && b.listings.length === 0) return status !== 'active'
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

export function findBuildingBySlug(
  slug: string,
  buildings: MapBuildingCluster[],
): MapBuildingCluster | null {
  return buildings.find((b) => b.slug === slug || b.id === `bldg-${slug}`) ?? null
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

/** Real OSM ring for a cluster, else the synthetic square. */
export function clusterGeometry(b: MapBuildingCluster): GeoJSON.Polygon {
  const real = FOOTPRINTS[b.id]
  if (real && real.ring.length >= 5) return { type: 'Polygon', coordinates: [real.ring] }
  return buildingFootprint(
    b.lat,
    b.lng,
    b.status === 'construction' && b.listings.length === 0 ? 18 : 14,
  )
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
        code: b.code ?? '',
        slug: b.slug ?? '',
        address: b.address,
        buildingNumber: b.buildingNumber,
        district: b.district,
        color: b.color,
        height: b.heightM,
        sale: b.counts.sale,
        rent: b.counts.rent,
        daily: b.counts.daily,
        pledge: b.counts.pledge,
        total: b.listings.length,
        dominant: b.dominant,
        status: b.status,
        progress: b.progress ?? 100,
        opacity: b.status === 'construction' && b.listings.length === 0 ? 0.55 : 0.92,
      },
      geometry: clusterGeometry(b),
    })),
  }
}

export const MAP_CENTER = { lat: 41.7151, lng: 44.8271 } as const
export const MAP_BRAND_WATER = BRAND.colors.navySoft
export const MAP_BRAND_LAND = BRAND.colors.navy
