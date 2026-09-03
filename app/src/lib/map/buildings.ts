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

import type { DealType, Listing, PropType } from '@/data/listings'
import { BUILDINGS, type BuildingCatalogEntry } from '@/data/buildings'
import { DEAL_BRAND, SERVICE_BRAND, STATUS_BRAND } from '@/lib/category-brand'
import { getDeveloper, projectCode, type Project } from '@/data/professionals'
import type { MapDealFilter, MapKindFilter, MapStatusFilter } from '@/lib/map/map-href'
import { NEIGHBORHOODS } from '@/data/neighborhoods'
import { TBILISI_DISTRICT_LABELS } from '@/data/district-labels'
import footprintData from '@/data/building-footprints.json'
import { naprOverrideFor } from '@/lib/map/napr-overrides'
import { circleRing } from '@/lib/map/footprint-circle'

/** Hard lock — m² Highlight is twin cylinders (korter Block 11/12). Never site polygons.
 *  Centroids from korter Block 11/12 polygons (Bakradze 7, east of Gelovani) — 2026-09-02. */
const CYLINDER_TOWERS: Record<
  string,
  ReadonlyArray<{ lat: number; lng: number; radiusM: number; floors: number }>
> = {
  'm2-highlight': [
    // Block 11 — 36 floors (south). Block 12 — 26 floors (north).
    { lat: 41.7481504, lng: 44.77095509, radiusM: 19.25, floors: 36 },
    { lat: 41.74873166, lng: 44.771317, radiusM: 17.75, floors: 26 },
  ],
}

function cylinderKey(b: { slug?: string; projectSlug?: string; id?: string }): string | undefined {
  const keys = [b.slug, b.projectSlug, b.id?.replace(/^(bldg|dev)-/, '')]
  for (const k of keys) if (k && k in CYLINDER_TOWERS) return k
  return undefined
}

function cylinderPartsFor(b: { slug?: string; projectSlug?: string; id?: string }): FootprintPart[] | null {
  const key = cylinderKey(b)
  if (!key) return null
  return CYLINDER_TOWERS[key]!.map((t) => ({
    ring: circleRing(t.lat, t.lng, t.radiusM, 64),
    floors: t.floors,
    circular: true as const,
    radiusM: t.radiusM,
  }))
}

/** Real OSM building rings keyed by cluster id (© OpenStreetMap contributors, ODbL).
 *  null = confirmed no OSM coverage → square fallback. Refresh: npx tsx scripts/fetch-footprints.ts
 *  parts = multi-tower synthetic / curated massing (one Feature per part). */
type FootprintRing = [number, number][]
type FootprintPart = {
  ring: FootprintRing
  floors?: number
  /** Round tower extrusion (m² Highlight cylinders). */
  circular?: boolean
  radiusM?: number
}
type FootprintEntry =
  | { ring: FootprintRing; osmId?: number; height?: number; parts?: undefined }
  | { parts: FootprintPart[]; osmId?: number; ring?: undefined; height?: undefined }
  | null

const FOOTPRINTS = footprintData.footprints as unknown as Record<string, FootprintEntry>

/** DB pins are `bldg-{slug}`; construction ghosts are `dev-{slug}`. Try both. */
function footprintEntry(b: {
  id?: string
  slug?: string
  projectSlug?: string
}): FootprintEntry | undefined {
  const keys = [b.id, b.slug && `bldg-${b.slug}`, b.slug && `dev-${b.slug}`]
  if (b.projectSlug) keys.push(`dev-${b.projectSlug}`, `bldg-${b.projectSlug}`)
  const seen = new Set<string>()
  for (const k of keys) {
    if (!k || seen.has(k)) continue
    seen.add(k)
    if (k in FOOTPRINTS) return FOOTPRINTS[k]
  }
  return undefined
}

function footprintPrimaryRing(
  fp: Exclude<FootprintEntry, null> | undefined,
): FootprintRing | undefined {
  if (!fp) return undefined
  if (fp.parts?.length) return fp.parts[0]!.ring
  return fp.ring
}

function footprintOsmHeightM(fp: FootprintEntry | undefined): number | undefined {
  if (!fp || fp.parts) return undefined
  return fp.height
}

/** OSM ring/parts centroid — pins stay glued to real massing, not catalog drift. */
function footprintCentroid(
  fp: Exclude<FootprintEntry, null> | undefined,
): { lat: number; lng: number } | null {
  if (!fp) return null
  const rings = fp.parts?.length ? fp.parts.map((p) => p.ring) : fp.ring ? [fp.ring] : []
  let sLat = 0
  let sLng = 0
  let n = 0
  for (const ring of rings) {
    const last = ring.length - 1
    const closed =
      last > 0 && ring[0]![0] === ring[last]![0] && ring[0]![1] === ring[last]![1]
    const end = closed ? last : ring.length
    for (let i = 0; i < end; i++) {
      sLng += ring[i]![0]!
      sLat += ring[i]![1]!
      n++
    }
  }
  return n ? { lat: sLat / n, lng: sLng / n } : null
}

/** Catalog pin: prefer committed OSM footprint centroid when present. */
function catalogCoords(cat: BuildingCatalogEntry): { lat: number; lng: number } {
  const fp = footprintEntry({ id: `bldg-${cat.slug}`, slug: cat.slug, projectSlug: cat.projectSlug })
  return (fp ? footprintCentroid(fp) : null) ?? cat.coords
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

export type { MapDealFilter, MapKindFilter, MapStatusFilter } from '@/lib/map/map-href'
export {
  parseMapKind,
  parseMapDeal,
  mapFiltersToSearchHref,
  mapHrefForListing,
} from '@/lib/map/map-href'

export function listingMatchesKind(l: { propType: PropType }, kind: MapKindFilter): boolean {
  switch (kind) {
    case 'all':
    case 'construction':
      return true
    case 'apartment':
      return l.propType === 'apartment'
    case 'house':
      return l.propType === 'house' || l.propType === 'villa'
    case 'commercial':
      return l.propType === 'commercial'
    case 'land':
      return l.propType === 'land'
    case 'hotel':
      return l.propType === 'hotel'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

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

/** Map pin / extrusion hue — construction always STATUS sky (never deal colors). */
export function pinHue(
  b: Pick<MapBuildingCluster, 'status' | 'color'>,
  deal: MapDealFilter = 'all',
): string {
  if (b.status === 'construction') return STATUS_BRAND.construction.hue
  if (b.status === 'completed') return SERVICE_BRAND.developers.hue
  if (deal !== 'all') return dealColor(deal)
  return b.color
}

export function dealLabelKa(deal: DealType, prop?: PropType): string {
  if (deal === 'rent' && prop === 'land') return 'გაიცემა იჯარით'
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
  const pin = catalogCoords(cat)
  return {
    ...cluster,
    id: `bldg-${cat.slug}`,
    label: cat.name,
    address: cat.address,
    buildingNumber: cat.buildingNumber,
    district: cat.district,
    city: cat.city,
    lat: pin.lat,
    lng: pin.lng,
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
    // ponytail: 110 m cap flattened 40–100 fl project towers; 350 m ≈ 110 fl.
    heightM: cat.projectSlug
      ? Math.min(cat.floors * 3.15, 350)
      : Math.min(18 + cat.floors * 3.1, 110),
    status: cat.status === 'construction' ? 'construction' : 'active',
  }
}

export function catalogToCluster(cat: BuildingCatalogEntry, listings: Listing[]): MapBuildingCluster {
  const counts = countDeals(listings)
  const dominant = listings.length ? dominantDeal(counts) : ('sale' as DealType)
  const pin = catalogCoords(cat)
  const base: MapBuildingCluster = {
    id: `bldg-${cat.slug}`,
    lat: pin.lat,
    lng: pin.lng,
    label: cat.name,
    address: cat.address,
    buildingNumber: cat.buildingNumber,
    district: cat.district,
    city: cat.city,
    listings,
    counts,
    dominant: cat.status === 'construction' && listings.length === 0 ? 'construction' : dominant,
    // ponytail: listings don't recolor construction — one sky for every მშენებარე pin.
    color:
      cat.status === 'construction'
        ? STATUS_BRAND.construction.hue
        : dealColor(dominant),
    heightM: cat.projectSlug
      ? Math.min(cat.floors * 3.15, 350)
      : Math.min(18 + cat.floors * 3.1, 110),
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
        if (host.status !== 'construction') host.color = dealColor(host.dominant)
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
      const id = `dev-${p.slug}`
      // NAPR CadRepGeo override wins over OSM/catalog pin when snap script succeeded.
      const naprRaw = naprOverrideFor(p.slug)
      const napr =
        naprRaw && haversineM(p.coords.lat, p.coords.lng, naprRaw.lat, naprRaw.lng) <= 80
          ? naprRaw
          : null
      const fp = footprintEntry({ id, slug: p.slug, projectSlug: p.slug })
      const glued = fp ? footprintCentroid(fp) : null
      const fpRing = footprintPrimaryRing(fp ?? undefined)
      const campus = !!(fp && fp.parts && fp.parts.length >= 2)
      const fpOk =
        !!fpRing &&
        footprintRingUsable(fpRing, glued?.lat ?? p.coords.lat, glued?.lng ?? p.coords.lng, {
          campus,
          ghost: !completed,
          floors,
          osmHeightM: footprintOsmHeightM(fp),
        })
      const baseLat = (fpOk && glued ? glued.lat : null) ?? napr?.lat ?? p.coords.lat
      const baseLng = (fpOk && glued ? glued.lng : null) ?? napr?.lng ?? p.coords.lng
      return {
        id,
        lat: baseLat,
        lng: baseLng,
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
        // ponytail: 110 m cap flattened 40–100 fl towers; 350 m ≈ 110 fl.
        heightM: Math.min(floors * 3.15, 350),
        status: completed ? ('completed' as const) : ('construction' as const),
        progress: p.done,
        projectSlug: p.slug,
        developerSlug: p.developerSlug || undefined,
        developerName: dev?.name.ka,
        code: projectCode(p),
        floors,
        finish: p.finish,
        img: p.img,
        ...(napr?.ring && !fpOk ? { ring: napr.ring } : {}),
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
    const completed = p.done >= 100
    const naprRaw = naprOverrideFor(p.slug)
    const napr =
      naprRaw && haversineM(p.coords.lat, p.coords.lng, naprRaw.lat, naprRaw.lng) <= 80
        ? naprRaw
        : null
    // TAS/OSM building outline for extrusion; NAPR lot only when no footprint.
    const fp = footprintEntry(b)
    const glued = fp ? footprintCentroid(fp) : null
    const fpRing = footprintPrimaryRing(fp ?? undefined)
    const campus = !!(fp && fp.parts && fp.parts.length >= 2)
    const floors = p.floors ?? b.floors
    const osmHeightM = footprintOsmHeightM(fp)
    const fpOk =
      !!fpRing &&
      footprintRingUsable(fpRing, glued?.lat ?? p.coords.lat, glued?.lng ?? p.coords.lng, {
        campus,
        ghost: !completed,
        floors,
        osmHeightM,
      })
    const snap = fpOk && glued ? glued : napr ? { lat: napr.lat, lng: napr.lng } : null
    return {
      ...b,
      lat: snap?.lat ?? p.coords.lat,
      lng: snap?.lng ?? p.coords.lng,
      ...(napr?.ring && !fpOk ? { ring: napr.ring } : {}),
      address: p.location || b.address,
      buildingNumber: bn || b.buildingNumber,
      developerSlug: p.developerSlug || b.developerSlug,
      developerName: dev?.name.ka ?? b.developerName,
      progress: p.done,
      status: completed ? ('completed' as const) : ('construction' as const),
      color: completed ? SERVICE_BRAND.developers.hue : STATUS_BRAND.construction.hue,
      dominant: completed ? b.dominant : ('construction' as const),
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
      // Official massing owns the pin — DB lat/lng must not drag the label off the towers.
      const official =
        !!cylinderPartsFor(b) || !!footprintEntry(b)?.parts?.length || !!footprintEntry(b)?.ring
      return {
        ...b,
        lat: official ? b.lat : db.lat,
        lng: official ? b.lng : db.lng,
        address: db.address || b.address,
        buildingNumber: db.buildingNumber || b.buildingNumber,
        developerSlug: db.developerSlug || b.developerSlug,
        developerName: db.developerName || b.developerName,
        projectSlug: db.projectSlug || b.projectSlug,
        // Official FOOTPRINTS / locked cylinders beat admin polygonCoords.
        ring: official ? undefined : (db.ring ?? b.ring),
        inventory: db.inventory ?? b.inventory,
        status: db.status,
        progress: db.progress ?? b.progress,
        color: pinHue({ status: db.status, color: db.color || b.color }),
      }
    }),
    ...dbClusters.filter((b) => {
      if (b.slug && staticSlugs.has(b.slug)) return false
      // ponytail: DB site-blob next to locked twins (m² Highlight) — drop, not a third mass.
      return !staticClusters.some(
        (s) => cylinderPartsFor(s) && haversineM(s.lat, s.lng, b.lat, b.lng) < 80,
      )
    }),
  ]
}

export function filterBuildings(
  buildings: MapBuildingCluster[],
  deal: MapDealFilter,
  status: MapStatusFilter,
  kind: MapKindFilter = 'all',
): MapBuildingCluster[] {
  const wantStatus: MapStatusFilter = kind === 'construction' ? 'construction' : status
  const out: MapBuildingCluster[] = []
  for (const b of buildings) {
    if (wantStatus === 'construction' && b.status !== 'construction') continue
    if (wantStatus === 'completed' && b.status !== 'completed') continue
    if (wantStatus === 'active' && (b.status === 'construction' || b.status === 'completed')) continue

    const kindListings =
      kind === 'all' || kind === 'construction'
        ? b.listings
        : b.listings.filter((l) => listingMatchesKind(l, kind))
    if (kind !== 'all' && kind !== 'construction' && kindListings.length === 0) continue

    const listings = deal === 'all' ? kindListings : kindListings.filter((l) => l.dealType === deal)
    if (listings.length === 0) {
      // Empty shells only on the construction chip/status — default "all" is live ads.
      if (
        b.status === 'construction' &&
        b.listings.length === 0 &&
        (deal === 'all' || deal === 'sale') &&
        (kind === 'construction' || wantStatus === 'construction')
      ) {
        out.push(b)
      }
      continue
    }
    if (listings.length === b.listings.length) {
      out.push(b)
      continue
    }
    const counts = countDeals(listings)
    const dominant = dominantDeal(counts)
    out.push({
      ...b,
      listings,
      counts,
      dominant,
      color: b.status === 'construction' ? b.color : dealColor(dominant),
    })
  }
  return out
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

export function findBuildingForListing(
  listingId: string,
  buildings: MapBuildingCluster[],
): MapBuildingCluster | null {
  return buildings.find((b) => b.listings.some((l) => l.id === listingId)) ?? null
}

/** Digomi-slab synthetic when OSM ring missing (Beliashvili 68 ≈52×63 m). */
export const FALLBACK_FOOTPRINT_HALF_M = 26
export const FALLBACK_FOOTPRINT_ASPECT = 1.4

export function buildingFootprint(
  lat: number,
  lng: number,
  halfM = FALLBACK_FOOTPRINT_HALF_M,
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
export function ringBboxHalfM(ring: ReadonlyArray<readonly number[]>): number {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const pt of ring) {
    const lng = pt[0]
    const lat = pt[1]
    if (lng === undefined || lat === undefined) continue
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
/** Multi-tower campus (Dirsi, ORBI, Axis twins) — parts may sit a block off the pin. */
export const FOOTPRINT_CAMPUS_MAX_PIN_M = 400

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
  opts?: { ghost?: boolean; campus?: boolean; floors?: number; osmHeightM?: number },
): boolean {
  if (ring.length < 5) return false
  const maxM = opts?.campus ? FOOTPRINT_CAMPUS_MAX_PIN_M : FOOTPRINT_MAX_PIN_M
  if (ringCentroidDistM(ring, lat, lng) > maxM) return false
  // ponytail: construction sites often match a neighbour shed — ignore if tiny.
  // NAPR parcel rings via napr-parcel.ts when cadastral/pin known.
  const half = ringBboxHalfM(ring)
  if (opts?.ghost && half < 14) return false
  // Lot / hill / masterplan polygons are not a tower. TAS podium ≤150 m is real.
  if (opts?.ghost && half > (opts?.campus ? 160 : 150)) return false
  const planned = opts?.floors ?? 0
  if (opts?.ghost && planned >= 12 && (opts.osmHeightM ?? 0) > 0) {
    const osmFloors = opts.osmHeightM! / 3.1
    if (osmFloors < planned * 0.4) return false
  }
  return true
}

/**
 * Pole of inaccessibility — center of the largest circle inside the ring
 * (Mapbox label point). Vertex averages fall into courtyard notches or outside
 * L-wings; this never leaves the walls. Equirectangular meters (building-scale
 * rings), ~0.25 m precision — sub-pixel at every zoom the embeds use.
 */
export function ringLabelPoint(
  ring: [number, number][],
): { lat: number; lng: number } {
  const last = ring.length - 1
  const closed =
    last > 0 && ring[0]![0] === ring[last]![0] && ring[0]![1] === ring[last]![1]
  const open = (closed ? ring.slice(0, last) : ring.slice()) as [number, number][]
  if (open.length < 3) {
    let lat = 0
    let lng = 0
    for (const [x, y] of open) {
      lng += x
      lat += y
    }
    const n = Math.max(open.length, 1)
    return { lat: lat / n, lng: lng / n }
  }
  const kx = 111_320 * Math.cos((open[0]![1] * Math.PI) / 180)
  const poly: [number, number][] = open.map(([lng, lat]) => [lng * kx, lat * 111_320])
  const segDist2 = (
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ): number => {
    const dx = bx - ax
    const dy = by - ay
    const t =
      dx || dy
        ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        : 0
    const ex = ax + t * dx - px
    const ey = ay + t * dy - py
    return ex * ex + ey * ey
  }
  // Signed distance: positive inside, negative out.
  const dist = (px: number, py: number): number => {
    let best2 = Infinity
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const ax = poly[j]![0]
      const ay = poly[j]![1]
      const bx = poly[i]![0]
      const by = poly[i]![1]
      best2 = Math.min(best2, segDist2(px, py, ax, ay, bx, by))
      if ((ay > py) !== (by > py) && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) {
        inside = !inside
      }
    }
    return Math.sqrt(best2) * (inside ? 1 : -1)
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let sx = 0
  let sy = 0
  for (const [x, y] of poly) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
    sx += x
    sy += y
  }
  const size = Math.max(maxX - minX, maxY - minY)
  if (size <= 0) return { lat: open[0]![1], lng: open[0]![0] }
  // Seed at the vertex average — already optimal for the convex rings most
  // footprints are, so the grid refines in a handful of steps.
  let bx = sx / poly.length
  let by = sy / poly.length
  let bestD = dist(bx, by)
  type Cell = { x: number; y: number; h: number; max: number }
  let queue: Cell[] = []
  const h0 = size / 2
  for (let x = minX; x < maxX; x += h0 * 2) {
    for (let y = minY; y < maxY; y += h0 * 2) {
      const cx = x + h0
      const cy = y + h0
      queue.push({ x: cx, y: cy, h: h0, max: dist(cx, cy) + h0 * Math.SQRT2 })
    }
  }
  while (queue.length > 0) {
    let bi = 0
    for (let i = 1; i < queue.length; i++) {
      if (queue[i]!.max > queue[bi]!.max) bi = i
    }
    const cell = queue.splice(bi, 1)[0]!
    if (cell.max <= bestD + 0.25) continue
    const d = dist(cell.x, cell.y)
    if (d > bestD) {
      bestD = d
      bx = cell.x
      by = cell.y
    }
    const h = cell.h / 2
    for (const [dx, dy] of [
      [-h, -h],
      [h, -h],
      [-h, h],
      [h, h],
    ]) {
      const cx = cell.x + dx
      const cy = cell.y + dy
      queue.push({ x: cx, y: cy, h, max: dist(cx, cy) + h * Math.SQRT2 })
    }
  }
  return { lat: by / 111_320, lng: bx / kx }
}

/**
 * Exact-building pin for detail embeds: committed footprint ring + its label
 * point, so the pin sits centered inside the marked walls even when catalog
 * coords are street geocodes tens of meters off. Verified OSM massing
 * (osmId > 0) beats hand-drawn fallback rings. Null → caller keeps raw coords.
 */
export function footprintPin(
  keys: { slug?: string; projectSlug?: string },
  at: { lat: number; lng: number },
): { lat: number; lng: number; ring: [number, number][] } | null {
  const cands: NonNullable<FootprintEntry>[] = []
  const seen = new Set<string>()
  for (const k of [keys.slug, keys.projectSlug].flatMap((s) => (s ? [`bldg-${s}`, `dev-${s}`] : []))) {
    const fp = FOOTPRINTS[k]
    if (fp && !seen.has(k)) {
      seen.add(k)
      cands.push(fp)
    }
  }
  const usableRing = (fp: NonNullable<FootprintEntry>): [number, number][] | null => {
    const ring = fp.parts?.length ? fp.parts[0]!.ring : fp.ring
    if (!ring) return null
    return footprintRingUsable(ring, at.lat, at.lng, {
      campus: !!(fp.parts && fp.parts.length >= 2),
      osmHeightM: fp.parts ? undefined : fp.height,
    })
      ? ring
      : null
  }
  const ring =
    cands.filter((fp) => (fp.osmId ?? 0) > 0).map(usableRing).find(Boolean) ??
    cands.map(usableRing).find((r) => r != null) ??
    null
  if (!ring) return null
  const p = ringLabelPoint(ring)
  return { lat: p.lat, lng: p.lng, ring }
}

function clusterFootprintOpts(b: MapBuildingCluster, fp: FootprintEntry | undefined) {
  const ghost = b.status === 'construction' && b.listings.length === 0
  return {
    ghost,
    floors: b.floors,
    osmHeightM: footprintOsmHeightM(fp),
    campus: !!(fp && fp.parts && fp.parts.length >= 2),
  }
}

/** Real OSM ring for a cluster, else synthetic slab (construction) / square (active). */
export function clusterGeometry(b: MapBuildingCluster): GeoJSON.Polygon {
  const fp = footprintEntry(b)
  // Official campus parts beat DB single ring.
  if (fp?.parts?.length) {
    const part = fp.parts.find((p) =>
      footprintRingUsable(p.ring, b.lat, b.lng, clusterFootprintOpts(b, fp)),
    )
    if (part) return { type: 'Polygon', coordinates: [part.ring] }
  }
  const ring = footprintPrimaryRing(fp ?? undefined) ?? b.ring
  const ghost = b.status === 'construction' && b.listings.length === 0
  if (ring && footprintRingUsable(ring, b.lat, b.lng, clusterFootprintOpts(b, fp))) {
    // Exact OSM outline — no bbox/hull (user: stay inside walls).
    return { type: 'Polygon', coordinates: [ring] }
  }
  if (ghost) {
    const floors = b.floors ?? Math.max(8, Math.round(b.heightM / 3.15))
    return buildingFootprint(b.lat, b.lng, ghostFootprintHalfM(floors), 1.55)
  }
  // ponytail: Digomi slab, not 28 m cube — half-building look on /map (Beliashvili 68).
  return buildingFootprint(b.lat, b.lng, FALLBACK_FOOTPRINT_HALF_M, FALLBACK_FOOTPRINT_ASPECT)
}

/** All rings to extrude — campus parts, else the primary cluster polygon. */
export function clusterRings(
  b: MapBuildingCluster,
): { ring: FootprintRing; floors?: number; circular?: boolean; radiusM?: number }[] {
  const locked = cylinderPartsFor(b)
  if (locked) {
    return locked.map((p) => ({
      ring: p.ring,
      floors: p.floors,
      circular: p.circular,
      radiusM: p.radiusM,
    }))
  }
  const fp = footprintEntry(b)
  // Official multi-tower parts beat DB/OSM single ring (admin polygonCoords overwrote twins).
  if (fp?.parts?.length) {
    const parts = fp.parts.filter((part) =>
      footprintRingUsable(part.ring, b.lat, b.lng, clusterFootprintOpts(b, fp)),
    )
    if (parts.length > 0) {
      return parts.map((p) => ({
        ring: p.ring,
        floors: p.floors,
        circular: p.circular,
        radiusM: p.radiusM,
      }))
    }
  }
  const ring = clusterGeometry(b).coordinates[0] as FootprintRing | undefined
  return ring && ring.length >= 5 ? [{ ring, floors: b.floors }] : []
}

/** Cheapest listing on the cluster — for mid-zoom price pills. */
export function clusterMinPriceGEL(
  b: MapBuildingCluster,
  deal: MapDealFilter = 'all',
): number | null {
  let min: number | null = null
  for (const l of b.listings) {
    if (deal !== 'all' && l.dealType !== deal) continue
    if (l.priceGEL > 0 && (min == null || l.priceGEL < min)) min = l.priceGEL
  }
  return min
}

function buildingProps(b: MapBuildingCluster, deal: MapDealFilter = 'all') {
  const minGel = clusterMinPriceGEL(b, deal)
  const hue = pinHue(b, deal)
  const ghost = b.status === 'construction' && b.listings.length === 0
  return {
    id: b.id,
    label: b.label,
    code: b.code ?? '',
    slug: b.slug ?? '',
    address: b.address,
    buildingNumber: b.buildingNumber,
    district: b.district,
    // Alpha baked into color — MapLibre 5 rejects data-driven fill-extrusion-opacity.
    color: colorWithAlpha(hue, ghost ? 0.78 : 0.95),
    hue,
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
    // Construction ghosts: progress % — same sky hue as the pin.
    priceLabel:
      minGel != null
        ? formatMapPinGEL(minGel)
        : ghost
          ? `${b.progress ?? 0}%`
          : '',
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

export function buildingsToGeoJSON(
  buildings: MapBuildingCluster[],
  deal: MapDealFilter = 'all',
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    // ponytail: GeoJSON.Feature widens FootprintRing → Position[] for @types/geojson
    features: buildings.flatMap((b): GeoJSON.Feature[] => {
      const locked = cylinderPartsFor(b)
      const fp = locked ? { parts: locked } : footprintEntry(b)
      // Multi-tower massing: one extrusion per part (MapLibre height is per-feature).
      // Ignore b.ring when parts exist — DB polygonCoords was a site blob over twins.
      if (fp?.parts && fp.parts.length > 0) {
        const ghost = b.status === 'construction' && b.listings.length === 0
        const parts = locked
          ? fp.parts
          : fp.parts.filter((part) =>
              footprintRingUsable(part.ring, b.lat, b.lng, clusterFootprintOpts(b, fp)),
            )
        if (parts.length > 0) {
          return parts.map((part, i) => {
            const floors = part.floors ?? b.floors ?? 8
            const height = Math.min(floors * 3.15, 350)
            return {
              type: 'Feature' as const,
              id: i === 0 ? b.id : `${b.id}__${i}`,
              properties: {
                ...buildingProps(b, deal),
                // Keep cluster id so map click → same panel for every tower.
                id: b.id,
                height,
                color: colorWithAlpha(pinHue(b, deal), ghost ? 0.78 : 0.95),
                // One label per campus — duplicate "m² Highlight" / M2-05 looked fused.
                label: i === 0 ? b.label : '',
                code: i === 0 ? (b.code ?? '') : '',
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
          properties: buildingProps(b, deal),
          geometry: clusterGeometry(b),
        },
      ]
    }),
  }
}

/** Point FC for MapLibre native clustering (polygons can't cluster). */
export function buildingsToPointsGeoJSON(
  buildings: MapBuildingCluster[],
  deal: MapDealFilter = 'all',
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: buildings.map((b) => ({
      type: 'Feature' as const,
      id: b.id,
      properties: buildingProps(b, deal),
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

export {
  MAP_CENTER,
  FREEDOM_SQUARE,
  GEORGIA_MAX_BOUNDS,
  MAP_MIN_ZOOM,
  GEORGIA_HALO_KM,
  GEORGIA_BORDER,
  GEORGIA_HOLE,
  GEORGIA_MASK_SOURCE,
  GEORGIA_MASK_LAYER,
  GEORGIA_MASK_MAXZOOM,
  GEORGIA_MASK_FC,
  MAP_BRAND_WATER,
  MAP_BRAND_LAND,
} from '@/lib/map/map-geo'
