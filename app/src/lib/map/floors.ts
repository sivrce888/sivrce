/**
 * SIVRCE floor stacks — per-floor 3D extrusions for the selected building.
 *
 * Algorithm (ponytail): same footprint repeated per floor, base/height as data
 * properties; availability = real listings grouped by `floor` (no fabrication —
 * per-unit developer inventory is the upgrade path via MapBuilding/Building3D).
 *
 * Ceiling: one source per selected building; recluster per floor when DB-backed.
 */

import {
  clusterGeometry,
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
}

const MIN_FLOORS = 1
const MAX_FLOORS = 60

/** Floors to draw: catalog value wins, else listings, else reverse the height formula. */
export function buildingFloorCount(b: MapBuildingCluster): number {
  const fromListings = Math.max(0, ...b.listings.map((l) => l.totalFloors || l.floor || 0))
  const raw = b.floors ?? (fromListings > 0 ? fromListings : Math.round((b.heightM - 18) / 3.1))
  return Math.max(MIN_FLOORS, Math.min(MAX_FLOORS, Math.round(raw)))
}

/** Where a listing lands in the stack: ground/land (0) → 1, overflow → top floor. */
export function listingFloor(floor: number, count: number): number {
  return Math.min(Math.max(1, floor || 1), count)
}

export function buildingFloors(b: MapBuildingCluster, deal: MapDealFilter = 'all'): FloorInfo[] {
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
        color: b.color,
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
  if (opts.showPrice && info.minPriceGEL != null) {
    lines.push(`₾${info.minPriceGEL.toLocaleString('ka-GE')}-დან`)
  }
  return { title, lines }
}
