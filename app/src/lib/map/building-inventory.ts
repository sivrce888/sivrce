/** Pure building inventory helpers (no DB) — used by db-buildings + check. */
import type { DealType, Listing } from '@/data/listings'

export function emptyDealCounts(): Record<DealType, number> {
  return { sale: 0, rent: 0, daily: 0, pledge: 0 }
}

export function aggregateBuildingDealCounts(
  listings: Listing[],
): Record<string, Record<DealType, number>> {
  const out: Record<string, Record<DealType, number>> = {}
  for (const l of listings) {
    if (!l.buildingSlug) continue
    const c = out[l.buildingSlug] ?? (out[l.buildingSlug] = emptyDealCounts())
    c[l.dealType]++
  }
  return out
}
