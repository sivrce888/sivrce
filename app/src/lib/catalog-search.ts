/**
 * When a launched non-GE market has no live DB/Meili inventory, /search
 * serves sample/catalog cards. Real listings always win.
 */
import type { DealType, Listing, PropType } from '@/data/listings'
import { filterGermanyInventory } from '@/data/listings-germany'
import { worldMetroChip } from '@/lib/countries/world-metro-all'
import { citySearchValues, homeScopeFor } from '@/lib/home-scope'
import { marketFromIso } from '@/lib/markets'
import { cityByName } from '@/lib/map/user-place'
import type { SearchFilters } from '@/lib/search'

import { deCityBySlug } from '@/lib/countries/de'

export function isGermanSearch(filters: SearchFilters): boolean {
  if (filters.country === 'DE') return true
  if (filters.city) {
    const slug = filters.city.toLowerCase()
    if (slug === 'berlin' || deCityBySlug(slug) !== null || cityByName(filters.city)?.cc === 'DE') return true
  }
  if (filters.q) {
    const qLower = filters.q.trim().toLowerCase()
    if (/^(?:berlin|munich|hamburg|frankfurt|cologne|ბერლინი|გერმანია)/i.test(qLower)) return true
  }
  return false
}

export function canCatalogFallback(filters: SearchFilters): boolean {
  if (filters.bbox || (filters.idsIn && filters.idsIn.length > 0)) return false
  if (isGermanSearch(filters)) return true
  if (!filters.country || filters.country === 'GE') return false
  if (filters.q) return false
  if (filters.dealType && filters.dealType !== 'buy') return false
  if (filters.propertyType && filters.propertyType !== 'apartment') return false
  if (filters.minPrice != null || filters.maxPrice != null) return false
  if (filters.rooms != null || filters.bedrooms != null) return false
  if (filters.features?.length || filters.tier || filters.verifiedOnly) return false
  if (filters.district) return false
  return true
}

function dealFromSearch(d: SearchFilters['dealType']): DealType | 'buy' | 'rent' | undefined {
  if (d === 'buy') return 'sale'
  if (d === 'mortgage') return 'pledge'
  if (d === 'rent' || d === 'daily') return d
  return undefined
}

export async function catalogSearch(filters: SearchFilters) {
  const isDe = isGermanSearch(filters)
  const market = isDe ? 'de' : marketFromIso(filters.country)
  if (!market || market === 'ge') return null
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 24))

  if (isDe) {
    const cityName = filters.city || (filters.q && /berlin|ბერლინი/i.test(filters.q) ? 'berlin' : undefined)
    const all = filterGermanyInventory({
      cityNames: cityName ? citySearchValues(cityName) : undefined,
      deal: dealFromSearch(filters.dealType),
      propType: filters.propertyType as PropType | undefined,
      district: filters.district,
      q: filters.q,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      rooms: filters.rooms,
    })
    if (all.length === 0) return null
    const slice = all.slice((page - 1) * pageSize, page * pageSize)
    return {
      hits: slice.map(listingToHit),
      totalHits: all.length,
      page,
      pageSize,
      totalPages: Math.ceil(all.length / pageSize),
      source: 'catalog' as const,
    }
  }

  const slug = filters.city ? cityByName(filters.city)?.slug : undefined
  const { getProjectCatalogListings } = await import('@/lib/listings-db')
  const all = getProjectCatalogListings(homeScopeFor(market, slug), 48)
  if (all.length === 0) return null
  const slice = all.slice((page - 1) * pageSize, page * pageSize)
  return {
    hits: slice.map(listingToHit),
    totalHits: all.length,
    page,
    pageSize,
    totalPages: Math.ceil(all.length / pageSize),
    source: 'catalog' as const,
  }
}

function listingToHit(l: Listing) {
  const eur = l.currencyOriginal === 'EUR'
  return {
    id: l.id,
    title: l.title,
    city: l.city,
    district: l.district,
    address: l.address,
    dealType: l.dealType,
    propertyType: l.propType,
    price: eur ? (l.priceOriginal ?? l.priceUSD) : l.priceUSD,
    currency: l.currencyOriginal ?? 'USD',
    priceUSD: l.priceUSD,
    pricePerSqm: l.perM2USD,
    pricePerSqmUSD: l.perM2USD,
    area: l.area,
    rooms: l.rooms,
    bedrooms: l.beds,
    bathrooms: l.baths,
    floor: l.floor,
    totalFloors: l.totalFloors,
    lat: l.coords.lat,
    lng: l.coords.lng,
    images: l.images,
    views: l.views,
    tier: l.badge === 'SUPER VIP' ? 'diamond' : l.badge === 'VIP+' ? 'super_vip' : l.badge === 'VIP' ? 'vip' : 'standard',
    trustScore: l.ai?.score ?? 90,
    verified: l.verified,
    features: l.features,
    createdAt: l.postedAt,
    agent: l.agent,
    metroNear: worldMetroChip(l.coords.lat, l.coords.lng),
    streetHref: l.streetHref ?? null,
    photoCount: l.images.length,
    projectCatalog: Boolean(l.projectCatalog),
    projectSlug: l.projectSlug ?? null,
    country: l.country,
  }
}

