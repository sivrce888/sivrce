/**
 * Building × static-catalog joins — SERVER ONLY.
 *
 * These two helpers live apart from data/buildings.ts because that module is
 * reachable from client map components; importing LISTINGS there shipped the
 * ~1.1 MB catalog to the browser. Live DB counts win at runtime; this is the
 * static fallback the buildings pages use when the DB is unavailable.
 */
import { LISTINGS, type DealType, type Listing } from './listings'

export function listingsForBuilding(slug: string): Listing[] {
  return LISTINGS.filter((l) => l.buildingSlug === slug)
}

export function buildingDealCounts(slug: string): Record<DealType, number> {
  const counts: Record<DealType, number> = { sale: 0, rent: 0, daily: 0, pledge: 0 }
  for (const l of listingsForBuilding(slug)) counts[l.dealType]++
  return counts
}
