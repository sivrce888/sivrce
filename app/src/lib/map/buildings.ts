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
import { DEAL_BRAND, SERVICE_BRAND, STATUS_BRAND } from '@/lib/category-brand'
import { BRAND } from '@/lib/brand'
import { getDeveloper, projectCode, type Project } from '@/data/professionals'
import { NEIGHBORHOODS } from '@/data/neighborhoods'
import footprintData from '@/data/building-footprints.json'

/** Real OSM building rings keyed by cluster id (© OpenStreetMap contributors, ODbL).
 *  null = confirmed no OSM coverage → square fallback. Refresh: npx tsx scripts/fetch-footprints.ts */
const FOOTPRINTS = footprintData.footprints as unknown as Record<
  string,
  { ring: [number, number][]; osmId: number } | null
>

const CELL_DEG = 0.00055 // ≈ 60 m at Tbilisi lat
export const NEAREST_RADIUS_M = 90

/** Hex → rgba string. MapLibre 5 fill-extrusion-opacity is constant-only. */
export function colorWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const n = Number.parseInt(full, 16)
  if (!Number.isFinite(n)) return hex
  const a = Math.min(1, Math.max(0, alpha))
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export type BuildingStatus = 'active' | 'construction' | 'completed' | 'ready'
export type BuildingDealCounts = Record<DealType, number>

/** Admin-edited per-floor inventory (BuildingFloor rows). When present on a
 *  cluster it wins over listing-derived floor stacks — real sellable stock. */
export type FloorInventoryRow = {
  n: number
  available: number
  sale: number
  rent: number
  daily: number
  pledge: number
  minPricePerSqm: number | null
}

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
  /** Real OSM ring supplied with the cluster (DB-curated buildings); wins over FOOTPRINTS. */
  ring?: [number, number][]
  /** Admin-edited floor inventory (DB); wins over listing-derived floor stacks. */
  inventory?: FloorInventoryRow[]
}

export type MapDealFilter = DealType | 'all'
export type MapStatusFilter = 'all' | 'active' | 'construction' | 'completed'

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

export function catalogToCluster(cat: BuildingCatalogEntry, listings: Listing[]): MapBuildingCluster {
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
        ? STATUS_BRAND.construction.hue
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

/** Unbuilt / ongoing / completed developments as clickable 3D ghosts + solids. */
export function projectsToConstructionBuildings(
  projects: Array<Project & { coords: { lat: number; lng: number }; floors?: number }>,
): MapBuildingCluster[] {
  const catalogProjectSlugs = new Set(
    BUILDINGS.map((b) => b.projectSlug).filter(Boolean) as string[],
  )
  return projects
    .filter(
      (p) =>
        isValidCoords(p.coords.lat, p.coords.lng) &&
        !catalogProjectSlugs.has(p.slug),
    )
    .map((p) => {
      const floors = p.floors ?? Math.max(8, Math.round(p.flats / 12))
      const bn = parseBuildingNumber(p.location) || '—'
      const completed = p.done >= 100
      const dev = getDeveloper(p.developerSlug)
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
        color: completed ? SERVICE_BRAND.developers.hue : STATUS_BRAND.construction.hue,
        heightM: Math.min(18 + floors * 3.1 * (p.done / 100 || 0.35), 110),
        status: completed ? ('completed' as const) : ('construction' as const),
        progress: p.done,
        projectSlug: p.slug,
        developerSlug: p.developerSlug || undefined,
        developerName: dev?.name.ka,
        code: projectCode(p),
        finish: p.finish,
      }
    })
}

/** Pin catalog / ghost buildings to live project address + coords when linked. */
export function applyLiveProjectPins(
  buildings: MapBuildingCluster[],
  projects: Array<Project & { coords: { lat: number; lng: number } }>,
): MapBuildingCluster[] {
  const bySlug = new Map<string, Project>()
  for (const p of projects) {
    if (isValidCoords(p.coords.lat, p.coords.lng)) bySlug.set(p.slug, p)
  }
  if (bySlug.size === 0) return buildings
  return buildings.map((b) => {
    const p = b.projectSlug ? bySlug.get(b.projectSlug) : undefined
    if (!p) return b
    const bn = parseBuildingNumber(p.location)
    const dev = getDeveloper(p.developerSlug)
    return {
      ...b,
      lat: p.coords.lat,
      lng: p.coords.lng,
      address: p.location || b.address,
      buildingNumber: bn || b.buildingNumber,
      developerSlug: p.developerSlug || b.developerSlug,
      developerName: dev?.name.ka ?? b.developerName,
    }
  })
}

export function mergeMapBuildings(
  listings: MapBuildingCluster[],
  developments: MapBuildingCluster[],
): MapBuildingCluster[] {
  return [...listings, ...developments]
}

/** DB-curated buildings win on pin (lat/lng/address/developer) + floor inventory. */
export function mergeDbBuildings(
  staticClusters: MapBuildingCluster[],
  dbClusters: MapBuildingCluster[],
): MapBuildingCluster[] {
  if (dbClusters.length === 0) return staticClusters
  const bySlug = new Map<string, MapBuildingCluster>()
  for (const b of dbClusters) if (b.slug) bySlug.set(b.slug, b)
  const staticSlugs = new Set(staticClusters.map((b) => b.slug).filter(Boolean))
  return [
    ...staticClusters.map((b) => {
      const db = b.slug ? bySlug.get(b.slug) : undefined
      if (!db) return b
      return {
        ...b,
        lat: db.lat,
        lng: db.lng,
        address: db.address || b.address,
        buildingNumber: db.buildingNumber || b.buildingNumber,
        developerSlug: db.developerSlug || b.developerSlug,
        developerName: db.developerName || b.developerName,
        projectSlug: db.projectSlug || b.projectSlug,
        ring: db.ring ?? b.ring,
        inventory: db.inventory ?? b.inventory,
      }
    }),
    ...dbClusters.filter((b) => !b.slug || !staticSlugs.has(b.slug)),
  ]
}

export function filterBuildings(
  buildings: MapBuildingCluster[],
  deal: MapDealFilter,
  status: MapStatusFilter,
): MapBuildingCluster[] {
  return buildings.filter((b) => {
    if (status === 'construction' && b.status !== 'construction') return false
    if (status === 'completed' && b.status !== 'completed') return false
    if (status === 'active' && (b.status === 'construction' || b.status === 'completed')) return false
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
  const ring = b.ring ?? FOOTPRINTS[b.id]?.ring
  if (ring && ring.length >= 5) return { type: 'Polygon', coordinates: [ring] }
  return buildingFootprint(
    b.lat,
    b.lng,
    b.status === 'construction' && b.listings.length === 0 ? 18 : 14,
  )
}

function buildingProps(b: MapBuildingCluster) {
  return {
    id: b.id,
    label: b.label,
    code: b.code ?? '',
    slug: b.slug ?? '',
    address: b.address,
    buildingNumber: b.buildingNumber,
    district: b.district,
    // Alpha baked into color — MapLibre 5 rejects data-driven fill-extrusion-opacity.
    color: colorWithAlpha(
      b.color,
      b.status === 'construction' && b.listings.length === 0 ? 0.78 : 0.95,
    ),
    hue: b.color,
    height: b.heightM,
    sale: b.counts.sale,
    rent: b.counts.rent,
    daily: b.counts.daily,
    pledge: b.counts.pledge,
    total: b.listings.length,
    dominant: b.dominant,
    status: b.status,
    progress: b.progress ?? 100,
  }
}

export function buildingsToGeoJSON(buildings: MapBuildingCluster[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: buildings.map((b) => ({
      type: 'Feature' as const,
      id: b.id,
      properties: buildingProps(b),
      geometry: clusterGeometry(b),
    })),
  }
}

/** Point FC for MapLibre native clustering (polygons can't cluster). */
export function buildingsToPointsGeoJSON(
  buildings: MapBuildingCluster[],
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: buildings.map((b) => ({
      type: 'Feature' as const,
      id: b.id,
      properties: buildingProps(b),
      geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
    })),
  }
}

/**
 * Neighborhoods as clickable map points — centroid coords + livability + avg price.
 * Toggleable from Map3D (off by default). ponytail: O(n) static; no boundary polygons.
 */
export function neighborhoodsToGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: NEIGHBORHOODS.map((n) => ({
      type: 'Feature' as const,
      id: `nbh-${n.slug}`,
      properties: {
        id: `nbh-${n.slug}`,
        slug: n.slug,
        name: n.name.ka,
        nameEn: n.name.en,
        city: n.city.ka,
        type: n.type,
        avgPriceM2USD: n.avgPriceM2USD,
        transport: n.scores.transport,
        schools: n.scores.schools,
        green: n.scores.green,
        safety: n.scores.safety,
        nightlife: n.scores.nightlife,
      },
      geometry: { type: 'Point', coordinates: [n.coords.lng, n.coords.lat] },
    })),
  }
}

export const MAP_CENTER = { lat: 41.7151, lng: 44.8271 } as const
/** Soft clamp — Georgia + Black Sea shelf; stops pan into Turkey/Russia. */
export const GEORGIA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [39.9, 40.95],
  [46.8, 43.6],
]
export const MAP_MIN_ZOOM = 7
export const MAP_BRAND_WATER = BRAND.colors.navySoft
export const MAP_BRAND_LAND = BRAND.colors.navy
