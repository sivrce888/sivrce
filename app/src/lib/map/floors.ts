/**
 * SIVRCE floor stacks — per-floor 3D extrusions for the selected building.
 *
 * Algorithm (ponytail): same footprint repeated per floor, base/height as data
 * properties; availability = admin-edited BuildingFloor inventory when present,
 * else real listings grouped by `floor` (no fabrication).
 *
 * Ceiling: one source per selected building; recluster per floor when DB-backed.
 */

import {
  clusterGeometry,
  colorWithAlpha,
  type MapBuildingCluster,
  type MapDealFilter,
} from './buildings'

export type FloorInfo = {
  /** 1-based floor number */
  n: number
  /** Live listings on this floor (respecting the active deal filter) */
  available: number
  /** Cheapest listing price in GEL on this floor, when comparable */
  minPriceGEL: number | null
  /** Developer price-list ₾/m² (inventory-backed floors only) */
  minPricePerSqm?: number | null
}

const MIN_FLOORS = 1
const MAX_FLOORS = 60

/** Floors to draw: admin inventory wins, then catalog value, listings, height formula. */
export function buildingFloorCount(b: MapBuildingCluster): number {
  if (b.inventory?.length) return Math.max(MIN_FLOORS, Math.min(MAX_FLOORS, b.inventory.length))
  const fromListings = Math.max(0, ...b.listings.map((l) => l.totalFloors || l.floor || 0))
  const raw = b.floors ?? (fromListings > 0 ? fromListings : Math.round((b.heightM - 18) / 3.1))
  return Math.max(MIN_FLOORS, Math.min(MAX_FLOORS, Math.round(raw)))
}

/**
 * Floor stack on /map only for developments with real stock — not every click.
 * Gate: admin inventory · construction ghost · multi-unit with floor-tagged listings.
 */
export function buildingShowsFloorStack(b: MapBuildingCluster): boolean {
  if (b.inventory?.length) return true
  if (b.status === 'construction') return true
  const floored = b.listings.filter((l) => (l.floor ?? 0) > 0).length
  return floored >= 2 && buildingFloorCount(b) >= 3
}

/** Where a listing lands in the stack: ground/land (0) → 1, overflow → top floor. */
export function listingFloor(floor: number, count: number): number {
  return Math.min(Math.max(1, floor || 1), count)
}

export function buildingFloors(b: MapBuildingCluster, deal: MapDealFilter = 'all'): FloorInfo[] {
  if (b.inventory?.length) {
    return b.inventory.map((r) => ({
      n: r.n,
      available: deal === 'all' ? r.available : r[deal],
      minPriceGEL: null,
      minPricePerSqm: r.minPricePerSqm,
    }))
  }
  const count = buildingFloorCount(b)
  const floors: FloorInfo[] = Array.from({ length: count }, (_, i) => ({
    n: i + 1,
    available: 0,
    minPriceGEL: null,
  }))
  for (const l of b.listings) {
    if (deal !== 'all' && l.dealType !== deal) continue
    const f = listingFloor(l.floor, count)
    const info = floors[f - 1]!
    info.available += 1
    if (l.priceGEL > 0) {
      info.minPriceGEL =
        info.minPriceGEL == null ? l.priceGEL : Math.min(info.minPriceGEL, l.priceGEL)
    }
  }
  return floors
}

/** Vertical gap between floor slabs so the stack reads as floors, not a blob. */
const FLOOR_GAP_M = 0.35

export function floorsToGeoJSON(
  b: MapBuildingCluster,
  deal: MapDealFilter = 'all',
): GeoJSON.FeatureCollection {
  const count = buildingFloorCount(b)
  const h = b.heightM / count
  const infos = buildingFloors(b, deal)
  const ghost = b.status === 'construction' && b.listings.length === 0
  const ring = clusterGeometry(b).coordinates[0]!
  return {
    type: 'FeatureCollection',
    features: infos.map((info, i) => ({
      type: 'Feature' as const,
      id: info.n,
      properties: {
        floor: info.n,
        base: i * h + (i === 0 ? 0 : FLOOR_GAP_M),
        top: (i + 1) * h,
        available: info.available,
        minPrice: info.minPriceGEL ?? 0,
        hasListings: b.listings.length > 0,
        ghost,
        color: colorWithAlpha(
          b.color,
          ghost ? 0.45 : info.available === 0 ? 0.3 : 0.92,
        ),
        label: info.available > 0 ? String(info.available) : '',
      },
      geometry: { type: 'Polygon' as const, coordinates: [ring] },
    })),
  }
}

export const EMPTY_FLOORS: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

/** Georgian tooltip line for a hovered floor. Price only when the deal filter
 *  makes prices comparable (single deal type). */
export function floorTooltipKa(
  info: FloorInfo,
  opts: { ghost: boolean; progress?: number; showPrice: boolean },
): { title: string; lines: string[] } {
  const title = `სართული ${info.n}`
  if (opts.ghost) {
    return {
      title,
      lines: [`მშენებარე · ${opts.progress ?? 0}%`, 'სართულების ხედი'],
    }
  }
  if (info.available === 0) return { title, lines: ['თავისუფალი ბინა არ არის'] }
  const lines = [`${info.available} თავისუფალია`]
  if (opts.showPrice && info.minPricePerSqm != null) {
    lines.push(`₾${info.minPricePerSqm.toLocaleString('ka-GE')}/მ²-დან`)
  } else if (opts.showPrice && info.minPriceGEL != null) {
    lines.push(`₾${info.minPriceGEL.toLocaleString('ka-GE')}-დან`)
  }
  return { title, lines }
}
