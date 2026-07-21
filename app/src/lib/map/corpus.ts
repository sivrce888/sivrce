/**
 * Stable corpus (კორპუსი) identity from coordinates.
 * Same ~60 m cell → same code/slug forever. Distinguishes every building.
 * ponytail: grid hash; upgrade → OSM way id when footprints cover the cell.
 */

import { createHash } from 'node:crypto'
import {
  buildingFootprint,
  FALLBACK_FOOTPRINT_ASPECT,
  FALLBACK_FOOTPRINT_HALF_M,
} from '@/lib/map/buildings'

/** ≈ 60 m at Tbilisi latitude — matches buildings.ts CELL_DEG */
const CELL_DEG = 0.00055

export type CorpusIdentity = {
  /** Public code e.g. SV-TB-A3F2 */
  code: string
  /** URL-safe slug e.g. corpus-tb-a3f2 */
  slug: string
  cellLat: number
  cellLng: number
}

function cityPrefix(city?: string | null): string {
  const c = (city ?? '').toLowerCase()
  if (c.includes('ბათუმ') || c.includes('batumi')) return 'BT'
  if (c.includes('ქუთაის') || c.includes('kutaisi')) return 'KU'
  if (c.includes('რუსთავ') || c.includes('rustavi')) return 'RU'
  return 'TB'
}

export function corpusCell(lat: number, lng: number): { cellLat: number; cellLng: number } {
  return {
    cellLat: Math.round(lat / CELL_DEG),
    cellLng: Math.round(lng / CELL_DEG),
  }
}

/** Deterministic 4-hex from cell — collision-safe within Georgia grid. */
export function corpusIdentity(
  lat: number,
  lng: number,
  city?: string | null,
): CorpusIdentity {
  const { cellLat, cellLng } = corpusCell(lat, lng)
  const prefix = cityPrefix(city)
  const digest = createHash('sha1')
    .update(`${cellLat}:${cellLng}`)
    .digest('hex')
    .slice(0, 4)
    .toUpperCase()
  const code = `SV-${prefix}-${digest}`
  return {
    code,
    slug: `corpus-${prefix.toLowerCase()}-${digest.toLowerCase()}`,
    cellLat,
    cellLng,
  }
}

/**
 * Synthetic ring when OSM miss — Digomi apartment slab (halfM=26, aspect=1.4).
 * Locked after Beliashvili 68: old ~40 m square marked half the block.
 */
export function corpusFootprint(lat: number, lng: number): [number, number][] {
  return buildingFootprint(lat, lng, FALLBACK_FOOTPRINT_HALF_M, FALLBACK_FOOTPRINT_ASPECT)
    .coordinates[0] as [number, number][]
}
