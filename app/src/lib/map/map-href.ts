/**
 * /map ↔ /search URL helpers — no footprints, no catalog.
 */

import type { DealType } from '@/data/listings'

export type MapDealFilter = DealType | 'all'
export type MapStatusFilter = 'all' | 'active' | 'construction' | 'completed'
/** Map chrome kinds — villa folds into house; construction is a building status. */
export type MapKindFilter =
  | 'all'
  | 'apartment'
  | 'house'
  | 'commercial'
  | 'land'
  | 'hotel'
  | 'construction'

const MAP_KINDS: readonly MapKindFilter[] = [
  'all',
  'apartment',
  'house',
  'commercial',
  'land',
  'hotel',
  'construction',
]

export function parseMapKind(v: unknown): MapKindFilter {
  return typeof v === 'string' && (MAP_KINDS as readonly string[]).includes(v)
    ? (v as MapKindFilter)
    : 'all'
}

export function parseMapDeal(v: unknown): MapDealFilter {
  return v === 'sale' || v === 'rent' || v === 'daily' || v === 'pledge' ? v : 'all'
}

/** /map chips → /search query. Construction is a building-status facet, not a prop type. */
export function mapFiltersToSearchHref(deal: MapDealFilter, kind: MapKindFilter): string {
  const q = new URLSearchParams()
  if (deal !== 'all') q.set('deal', deal)
  switch (kind) {
    case 'all':
      break
    case 'construction':
      q.set('bstat', 'add.status.construction')
      break
    case 'house':
    case 'apartment':
    case 'commercial':
    case 'land':
    case 'hotel':
      q.set('type', kind)
      break
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
  const qs = q.toString()
  return qs ? `/search?${qs}` : '/search'
}

/** Listing page → /map so the 3D camera opens on this ad. */
export function mapHrefForListing(l: {
  id: string
  buildingSlug?: string
  coords: { lat: number; lng: number }
  dealType?: DealType
  floor?: number
}): string {
  const q = new URLSearchParams()
  if (l.buildingSlug) q.set('building', l.buildingSlug)
  q.set('lat', l.coords.lat.toFixed(6))
  q.set('lng', l.coords.lng.toFixed(6))
  q.set('listing', l.id)
  if (l.dealType) q.set('deal', l.dealType)
  if (l.floor && l.floor > 0) q.set('floor', String(l.floor))
  return `/map?${q}`
}
