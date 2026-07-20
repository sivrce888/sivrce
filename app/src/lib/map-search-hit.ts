/**
 * Map an /api/search hit → Listing shape for cards / favorites / compare.
 * Shared so client rails don't each re-implement Meili vs DB field quirks.
 */
import type { DealType, Listing, PropType } from '@/data/listings'
import { aiLabel } from '@/lib/ai-label'
import { hitPrices } from '@/lib/hit-prices'
import { tierKeyToBadge } from '@/lib/promo-pricing'

export function mapSearchHit(h: Record<string, unknown>): Listing {
  const postedAt = (h.createdAt as string) ?? new Date().toISOString()
  const tier = h.tier as string | undefined
  const { priceUSD, priceGEL, perM2USD } = hitPrices(h)
  const score = (h.trustScore as number) ?? 70
  const projectCatalog = Boolean(h.projectCatalog)
  return {
    id: h.id as string,
    title: h.title as string,
    city: h.city as string,
    district: h.district as string,
    dealType: h.dealType as DealType,
    propType: h.propertyType as PropType,
    priceUSD,
    priceGEL,
    perM2USD,
    area: h.area as number,
    rooms: (h.rooms as number) ?? 0,
    images: (h.images as string[]) ?? [],
    img: ((h.images as string[])?.[0]) ?? '/images/p1.webp',
    address: (h.address as string) ?? '',
    beds: (h.bedrooms as number) ?? 0,
    baths: (h.bathrooms as number) ?? 0,
    floor: (h.floor as number) ?? 0,
    totalFloors: (h.totalFloors as number) ?? 0,
    views: (h.views as number) ?? 0,
    badge: tierKeyToBadge(String(tier ?? '')),
    ai: { score, label: aiLabel(score, projectCatalog) },
    features: (h.features as string[]) ?? [],
    description: (h.description as string) ?? '',
    condition: (h.condition as string) ?? null,
    projectCatalog,
    projectSlug: (h.projectSlug as string) ?? null,
    coords: { lat: (h.lat as number) ?? 41.7, lng: (h.lng as number) ?? 44.8 },
    postedAt,
    agent: (h.agent as Listing['agent']) ?? { name: 'Sivrce', phone: '', agency: '' },
    isNew: Date.now() - new Date(postedAt).getTime() < 72 * 3600_000,
    highlighted: Boolean(h.colorUntil && Date.parse(String(h.colorUntil)) > Date.now()),
    stickerUrgent: Boolean(h.urgentUntil && Date.parse(String(h.urgentUntil)) > Date.now()),
    stickerPriceDrop: Boolean(h.priceDropUntil && Date.parse(String(h.priceDropUntil)) > Date.now()),
    inStory: Boolean(h.storyUntil && Date.parse(String(h.storyUntil)) > Date.now()),
  }
}
