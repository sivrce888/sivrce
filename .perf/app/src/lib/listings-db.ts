/**
 * SIVRCE — DB-backed listing queries.
 * Drop-in replacement for src/data/listings.ts static mock data.
 *
 * Every public function mirrors the signature of data/listings.ts so consumers
 * can swap the import path without changing call sites.
 *
 * ponytail: single-file query layer. Upgrade path: split into domain modules
 * (search, detail, related) when query complexity warrants.
 */

import { db } from "@/lib/db"
import type { ListingDealType, ListingPropertyType } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"

// Re-export types that consumers expect (same shape as data/listings.ts)
export type DealType = "sale" | "rent" | "daily"
export type PropType = "apartment" | "house" | "commercial" | "land"
export type Badge = "SUPER VIP" | "VIP+" | "VIP" | null
export type SortKey = "date" | "price-asc" | "price-desc" | "area" | "ai"

export const USD_GEL = 2.7

// Map public API deal types to Prisma enum
function dealToDb(d: DealType): ListingDealType {
  if (d === "sale") return "buy"
  if (d === "rent") return "rent"
  return "daily"
}

function propToDb(p: PropType): ListingPropertyType {
  if (p === "apartment") return "apartment"
  if (p === "house") return "house"
  if (p === "commercial") return "commercial"
  return "land"
}

// Map DB tier → public badge
function dbTierToBadge(tier: string): Badge {
  if (tier === "super_vip") return "SUPER VIP"
  if (tier === "vip") return "VIP+"
  return null
}

export interface Agent {
  name: string
  phone: string
  agency: string
}

export interface Listing {
  id: string
  img: string
  images: string[]
  priceUSD: number
  priceGEL: number
  perM2USD: number
  title: string
  address: string
  city: string
  district: string
  dealType: DealType
  propType: PropType
  rooms: number
  beds: number
  baths: number
  area: number
  floor: number
  totalFloors: number
  views: number
  badge: Badge
  ai: { score: number; label: string }
  features: string[]
  description: string
  coords: { lat: number; lng: number }
  postedAt: string
  agent: Agent
  isNew: boolean
}

// Map a Prisma listing row → public Listing shape
function rowToListing(row: Record<string, unknown>): Listing {
  const r = row as Record<string, unknown>
  const priceGEL = (r.price as number) ?? 0
  const perM2GEL = (r.pricePerSqm as number) ?? 0
  const agentRaw = (r.agent as { name?: string; phone?: string; agency?: string }) ?? {}
  const aiScore = (r.trustScore as number) ?? 70
  const createdAt = (r.createdAt as Date) ?? new Date()

  return {
    id: r.id as string,
    img: ((r.images as string[]) ?? [])[0] ?? "/images/p1.webp",
    images: (r.images as string[]) ?? [],
    priceUSD: Math.round(priceGEL / USD_GEL),
    priceGEL,
    perM2USD: Math.round(perM2GEL / USD_GEL),
    title: (r.title as string) ?? "",
    address: (r.address as string) ?? "",
    city: (r.city as string) ?? "",
    district: (r.district as string) ?? "",
    dealType: (r.dealType as string) === "buy" ? "sale" : (r.dealType as string) === "rent" ? "rent" : "daily",
    propType: (r.propertyType as PropType) ?? "apartment",
    rooms: (r.rooms as number) ?? 0,
    beds: (r.bedrooms as number) ?? 0,
    baths: (r.bathrooms as number) ?? 0,
    area: (r.area as number) ?? 0,
    floor: (r.floor as number) ?? 0,
    totalFloors: (r.totalFloors as number) ?? 0,
    views: (r.views as number) ?? 0,
    badge: dbTierToBadge((r.tier as string) ?? "standard"),
    ai: { score: aiScore, label: aiScore >= 90 ? "შესანიშნავი ფასი" : aiScore >= 75 ? "კარგი შეთავაზება" : "საშუალო" },
    features: (r.features as string[]) ?? [],
    description: (r.description as string) ?? "",
    coords: { lat: (r.lat as number) ?? 41.7151, lng: (r.lng as number) ?? 44.8271 },
    postedAt: createdAt.toISOString().slice(0, 10),
    agent: {
      name: agentRaw.name ?? "სივრცე",
      phone: agentRaw.phone ?? "+995 555 00 00 00",
      agency: agentRaw.agency ?? "სივრცე პრემიუმ",
    },
    isNew: Date.now() - createdAt.getTime() < 7 * 86400000,
  }
}

/** Get a single listing by ID. Returns null if not found or soft-deleted. */
export async function getListing(id: string): Promise<Listing | null> {
  const row = await db.listing.findFirst({
    where: { id, deletedAt: null, status: "active" },
  })
  if (!row) return null
  return rowToListing(row as unknown as Record<string, unknown>)
}

/** Get all active listings (homepage carousel, sitemap). */
export async function getAllListings(): Promise<Listing[]> {
  const rows = await db.listing.findMany({
    where: { deletedAt: null, status: "active" },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
}

/** Filtered search — mirrors data/listings.ts filterListings(). */
export async function filterListings(opts: {
  dealType?: DealType
  propType?: PropType
  city?: string
  district?: string
  rooms?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  q?: string
  sort?: SortKey
}): Promise<Listing[]> {
  const where: Prisma.ListingWhereInput = { deletedAt: null, status: "active" }

  if (opts.dealType) where.dealType = dealToDb(opts.dealType)
  if (opts.propType) where.propertyType = propToDb(opts.propType)
  if (opts.city) where.city = opts.city
  if (opts.district) where.district = opts.district
  if (opts.rooms) {
    const n = parseInt(opts.rooms, 10)
    if (opts.rooms === "5+") where.rooms = { gte: 5 }
    else if (!isNaN(n)) where.rooms = n
  }
  if (opts.minPrice !== undefined || opts.maxPrice !== undefined) {
    where.price = {}
    if (opts.minPrice !== undefined) (where.price as Prisma.IntFilter).gte = opts.minPrice
    if (opts.maxPrice !== undefined) (where.price as Prisma.IntFilter).lte = opts.maxPrice
  }
  if (opts.minArea !== undefined || opts.maxArea !== undefined) {
    where.area = {}
    if (opts.minArea !== undefined) (where.area as Prisma.FloatFilter).gte = opts.minArea
    if (opts.maxArea !== undefined) (where.area as Prisma.FloatFilter).lte = opts.maxArea
  }
  if (opts.q) {
    where.OR = [
      { title: { contains: opts.q, mode: "insensitive" } },
      { description: { contains: opts.q, mode: "insensitive" } },
      { address: { contains: opts.q, mode: "insensitive" } },
      { city: { contains: opts.q, mode: "insensitive" } },
      { district: { contains: opts.q, mode: "insensitive" } },
    ]
  }

  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: "desc" }
  if (opts.sort === "price-asc") orderBy = { price: "asc" }
  else if (opts.sort === "price-desc") orderBy = { price: "desc" }
  else if (opts.sort === "area") orderBy = { area: "desc" }
  else if (opts.sort === "ai") orderBy = { trustScore: "desc" }

  const rows = await db.listing.findMany({
    where,
    orderBy,
    take: 100,
  })
  return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
}

/** Distinct cities with active listings. */
export async function getCities(): Promise<string[]> {
  const rows = await db.listing.findMany({
    where: { deletedAt: null, status: "active" },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  })
  return rows.map((r) => r.city)
}

/** Districts for a given city with active listings. */
export async function getDistricts(city: string): Promise<string[]> {
  const rows = await db.listing.findMany({
    where: { city, deletedAt: null, status: "active" },
    select: { district: true },
    distinct: ["district"],
    orderBy: { district: "asc" },
  })
  return rows.map((r) => r.district)
}

// ---- Formatting (identical to data/listings.ts) ----

export function formatUSD(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}

export function formatGEL(n: number): string {
  return `${n.toLocaleString('en-US')} ₾`
}

export function formatListingPrice(l: Listing): string {
  if (l.dealType === 'rent') return `${formatUSD(l.priceUSD)}/თვე`
  if (l.dealType === 'daily') return `${formatUSD(l.priceUSD)}/დღე`
  return formatUSD(l.priceUSD)
}

export function formatPerM2(l: Listing, currency?: 'GEL' | 'USD'): string {
  if (currency === 'GEL') {
    const gelPerM2 = Math.round(l.perM2USD * USD_GEL)
    return `${gelPerM2.toLocaleString('en-US')}₾/მ²`
  }
  return `$${l.perM2USD.toLocaleString('en-US')}/მ²`
}

export function formatViews(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}კ`
  return String(v)
}

export function formatFloor(l: Listing): string {
  if (l.propType === 'house') return `${l.totalFloors} სართ.`
  if (l.propType === 'land') return '—'
  return `${l.floor}/${l.totalFloors}`
}

export function postedDaysAgo(l: Listing, today = new Date()): number {
  const posted = new Date(`${l.postedAt}T00:00:00`)
  return Math.max(0, Math.round((today.getTime() - posted.getTime()) / 86400000))
}
