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
import { TBILISI_DISTRICT_LABELS } from '@/data/district-labels'
import footprintData from '@/data/building-footprints.json'

/** Real OSM building rings keyed by cluster id (© OpenStreetMap contributors, ODbL).
 *  null = confirmed no OSM coverage → square fallback. Refresh: npx tsx scripts/fetch-footprints.ts
 *  parts = multi-tower synthetic / curated massing (one Feature per part). */
type FootprintRing = [number, number][]
type FootprintPart = { ring: FootprintRing; floors?: number }
type FootprintEntry =
  | { ring: FootprintRing; osmId?: number; height?: number; parts?: undefined }
  | { parts: FootprintPart[]; osmId?: number; ring?: undefined; height?: undefined }
  | null

const FOOTPRINTS = footprintData.footprints as unknown as Record<string, FootprintEntry>

function footprintPrimaryRing(
  fp: Exclude<FootprintEntry, null> | undefined,
): FootprintRing | undefined {
  if (!fp) return undefined
  if (fp.parts?.length) return fp.parts[0]!.ring
  return fp.ring
}

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
  // ponytail: SEO alias shares the catalog pin — don't drop a second massing on top.
  catalogProjectSlugs.add('axis-towers-vake')
  return projects
    .filter(
      (p) =>
        isValidCoords(p.coords.lat, p.coords.lng) &&
        !catalogProjectSlugs.has(p.slug),
    )
    .map((p) => {
      const floors = Math.min(
        100,
        p.floors ?? Math.max(8, Math.round(p.flats / 12)),
      )
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
        // Full planned height — progress stays on the panel, not the massing.
        heightM: Math.min(floors * 3.15, 110),
        status: completed ? ('completed' as const) : ('construction' as const),
        progress: p.done,
        projectSlug: p.slug,
        developerSlug: p.developerSlug || undefined,
        developerName: dev?.name.ka,
        code: projectCode(p),
        floors,
        finish: p.finish,
        img: p.img,
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
  /** >1 stretches E–W — Georgian slab towers, not cubes. */
  aspect = 1,
): GeoJSON.Polygon {
  const dLat = halfM / 111_320
  const dLng = (halfM * aspect) / (111_320 * Math.cos((lat * Math.PI) / 180))
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

/** Synthetic massing size when OSM ring missing — scales with planned floors. */
export function ghostFootprintHalfM(floors: number): number {
  return Math.min(34, Math.max(16, 10 + floors * 0.85))
}

/** Bbox half-extent (m) of a closed ring — used to reject shed-sized OSM hits. */
export function ringBboxHalfM(ring: [number, number][]): number {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  const latC = (minLat + maxLat) / 2
  const w = (maxLng - minLng) * 111_320 * Math.cos((latC * Math.PI) / 180)
  const h = (maxLat - minLat) * 111_320
  return Math.max(w, h) / 2
}

/** Distance from pin to ring centroid. Reject OSM hits glued to a neighbour block. */
export const FOOTPRINT_MAX_PIN_M = 90

export function ringCentroidDistM(
  ring: [number, number][],
  lat: number,
  lng: number,
): number {
  let sLat = 0
  let sLng = 0
  let n = 0
  const last = ring.length - 1
  const closed =
    last > 0 && ring[0]![0] === ring[last]![0] && ring[0]![1] === ring[last]![1]
  const end = closed ? last : ring.length
  for (let i = 0; i < end; i++) {
    sLng += ring[i]![0]!
    sLat += ring[i]![1]!
    n++
  }
  if (n === 0) return Infinity
  return haversineM(lat, lng, sLat / n, sLng / n)
}

/** True when an OSM/curated ring is safe to extrude at this pin. */
export function footprintRingUsable(
  ring: [number, number][],
  lat: number,
  lng: number,
  opts?: { ghost?: boolean },
): boolean {
  if (ring.length < 5) return false
  if (ringCentroidDistM(ring, lat, lng) > FOOTPRINT_MAX_PIN_M) return false
  // ponytail: construction sites often match a neighbour shed — ignore if tiny.
  // Upgrade → cadastral / developer site polygons.
  if (opts?.ghost && ringBboxHalfM(ring) < 14) return false
  return true
}

/** Real OSM ring for a cluster, else synthetic slab (construction) / square (active). */
export function clusterGeometry(b: MapBuildingCluster): GeoJSON.Polygon {
  const ring = b.ring ?? footprintPrimaryRing(FOOTPRINTS[b.id] ?? undefined)
  const ghost = b.status === 'construction' && b.listings.length === 0
  if (ring && footprintRingUsable(ring, b.lat, b.lng, { ghost })) {
    return { type: 'Polygon', coordinates: [ring] }
  }
  if (ghost) {
    const floors = b.floors ?? Math.max(8, Math.round(b.heightM / 3.15))
    return buildingFootprint(b.lat, b.lng, ghostFootprintHalfM(floors), 1.55)
  }
  return buildingFootprint(b.lat, b.lng, 14)
}

/** Cheapest active listing on the cluster — for mid-zoom price pills. */
export function clusterMinPriceGEL(b: MapBuildingCluster): number | null {
  let min: number | null = null
  for (const l of b.listings) {
    if (l.priceGEL > 0 && (min == null || l.priceGEL < min)) min = l.priceGEL
  }
  return min
}

function buildingProps(b: MapBuildingCluster) {
  const minGel = clusterMinPriceGEL(b)
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
    // GEL compact — map has no currency context; list view uses formatMapPin.
    priceLabel: minGel == null ? '' : formatMapPinGEL(minGel),
  }
}

/** ponytail: GEL-only pin label for GeoJSON (no React currency ctx). */
function formatMapPinGEL(gel: number): string {
  if (!Number.isFinite(gel) || gel <= 0) return ''
  if (gel >= 1_000_000) {
    const m = gel / 1_000_000
    const s = m >= 10 ? String(Math.round(m)) : String(Math.round(m * 10) / 10)
    return `${s}მლნ₾`
  }
  if (gel >= 10_000) return `${Math.round(gel / 1000)}კ₾`
  return `${Math.round(gel)}₾`
}

export function buildingsToGeoJSON(buildings: MapBuildingCluster[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    // ponytail: GeoJSON.Feature widens FootprintRing → Position[] for @types/geojson
    features: buildings.flatMap((b): GeoJSON.Feature[] => {
      const fp = FOOTPRINTS[b.id]
      // Multi-tower massing: one extrusion per part (MapLibre height is per-feature).
      if (fp?.parts && fp.parts.length > 0 && !b.ring) {
        const ghost = b.status === 'construction' && b.listings.length === 0
        const parts = fp.parts.filter((part) =>
          footprintRingUsable(part.ring, b.lat, b.lng, { ghost: false }),
        )
        if (parts.length > 0) {
          return parts.map((part, i) => {
            const floors = part.floors ?? b.floors ?? 8
            const height = Math.min(floors * 3.15, 110)
            return {
              type: 'Feature' as const,
              id: i === 0 ? b.id : `${b.id}__${i}`,
              properties: {
                ...buildingProps(b),
                // Keep cluster id so map click → same panel for every tower.
                id: b.id,
                height,
                color: colorWithAlpha(b.color, ghost ? 0.78 : 0.95),
              },
              geometry: { type: 'Polygon' as const, coordinates: [part.ring] },
            }
          })
        }
      }
      return [
        {
          type: 'Feature' as const,
          id: b.id,
          properties: buildingProps(b),
          geometry: clusterGeometry(b),
        },
      ]
    }),
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
 * District/ubani labels for /map — Tbilisi label sheet + guide cities (Batumi/Kutaisi).
 * Guide neighborhoods overlay livability; map-only labels are name+coords.
 * Borders: tbilisi-raions.json (10 raions).
 */
export function neighborhoodsToGeoJSON(): GeoJSON.FeatureCollection {
  const guideBySlug = new Map(NEIGHBORHOODS.map((n) => [n.slug, n]))
  const features: GeoJSON.Feature[] = TBILISI_DISTRICT_LABELS.map((d) => {
    const g = guideBySlug.get(d.slug)
    return {
      type: 'Feature' as const,
      id: `nbh-${d.slug}`,
      properties: g
        ? {
            id: `nbh-${d.slug}`,
            slug: d.slug,
            name: g.name.ka,
            nameEn: g.name.en,
            city: g.city.ka,
            type: g.type,
            hasGuide: true,
            avgPriceM2USD: g.avgPriceM2USD,
            transport: g.scores.transport,
            schools: g.scores.schools,
            green: g.scores.green,
            safety: g.scores.safety,
            nightlife: g.scores.nightlife,
          }
        : {
            id: `nbh-${d.slug}`,
            slug: d.slug,
            name: d.name.ka,
            nameEn: d.name.en,
            city: 'თბილისი',
            type: 'Neighborhood',
            hasGuide: false,
          },
      geometry: {
        type: 'Point' as const,
        // Guide pages keep their curated pin; label sheet is the map truth for shared slugs.
        coordinates: [d.coords.lng, d.coords.lat],
      },
    }
  })
  // Batumi / Kutaisi city pins (not on Tbilisi sheet)
  for (const n of NEIGHBORHOODS) {
    if (n.cityKey === 'თბილისი') continue
    features.push({
      type: 'Feature',
      id: `nbh-${n.slug}`,
      properties: {
        id: `nbh-${n.slug}`,
        slug: n.slug,
        name: n.name.ka,
        nameEn: n.name.en,
        city: n.city.ka,
        type: n.type,
        hasGuide: true,
        avgPriceM2USD: n.avgPriceM2USD,
        transport: n.scores.transport,
        schools: n.scores.schools,
        green: n.scores.green,
        safety: n.scores.safety,
        nightlife: n.scores.nightlife,
      },
      geometry: { type: 'Point', coordinates: [n.coords.lng, n.coords.lat] },
    })
  }
  return { type: 'FeatureCollection', features }
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
