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
import { safeQuery } from "@/lib/guards"
import { unstable_cache } from "next/cache"
import { CITIES, districtsOf } from "@/data/listings"
import type { ListingDealType, ListingPropertyType } from "@/generated/prisma/enums"
import type { Prisma } from "@/generated/prisma/client"
import {
  activeColorUntil,
  activePriceDropUntil,
  activeStoryUntil,
  activeUrgentUntil,
  effectiveTierKey,
  tierKeyToBadge,
  tierRankOf,
  type PromoBadge,
  type PromoExtFields,
} from "@/lib/promo-pricing"
import { aiLabel } from "@/lib/ai-label"
import { MAP_CENTER } from "@/lib/map/buildings"
import { maskPhone } from "@/lib/inquiries/phone"
import { resolveOwnerProfile } from "@/lib/profiles/public"
import type { SellerRole } from "@/lib/profiles/roles"
import { listingPublicId, parseListingNumber, parsePhoneDigits } from "@/lib/listing-public-id"

// Re-export types that consumers expect (same shape as data/listings.ts)
export type DealType = "sale" | "rent" | "daily" | "pledge"
export type PropType = "apartment" | "house" | "villa" | "commercial" | "land" | "hotel"
export type Badge = PromoBadge | null
export type SortKey = "date" | "price-asc" | "price-desc" | "area" | "ai"

export const USD_GEL = 2.7

// Map public API deal types to Prisma enum
function dealToDb(d: DealType): ListingDealType {
  if (d === "sale") return "buy"
  if (d === "rent") return "rent"
  if (d === "pledge") return "mortgage"
  return "daily"
}

function propToDb(p: PropType): ListingPropertyType {
  switch (p) {
    case "apartment": return "apartment"
    case "house": return "house"
    case "villa": return "villa"
    case "commercial": return "commercial"
    case "hotel": return "hotel"
    case "land": return "land"
    default: {
      const _x: never = p
      return _x
    }
  }
}

// Map DB tier → public badge (vip · super_vip=VIP+ · diamond=SUPER VIP)
function dbTierToBadge(tier: string, expiresAt?: Date | string | null): Badge {
  return tierKeyToBadge(effectiveTierKey(tier, expiresAt))
}

export interface Agent {
  name: string
  phone: string
  agency: string
  /** Public profile URL — /u/[id] or /agents|/developers/[slug] */
  profileHref?: string | null
  role?: SellerRole
  verified?: boolean
  image?: string | null
}

export interface Listing {
  id: string
  /** MyHome-style 8-digit public number — searchable. */
  publicId?: number
  img: string
  images: string[]
  priceUSD: number
  priceGEL: number
  /** Locked nominal price originally entered by poster (e.g. 800) */
  priceOriginal?: number | null
  /** Original currency selected by poster ('GEL' | 'USD') */
  currencyOriginal?: 'GEL' | 'USD' | null
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
  highlighted?: boolean
  stickerUrgent?: boolean
  stickerPriceDrop?: boolean
  inStory?: boolean
  ai: { score: number; label: string }
  features: string[]
  description: string
  project?: string | null
  floorType?: string | null
  kitchenArea?: number | null
  condition?: string | null
  projectCatalog?: boolean
  projectSlug?: string | null
  coords: { lat: number; lng: number }
  postedAt: string
  agent: Agent
  isNew: boolean
}

// Map a Prisma listing row → public Listing shape
function rowToListing(row: Record<string, unknown>): Listing {
  const r = row as Record<string, unknown>
  // Rows store price in their own `currency` (USD default); preserve locked currencyOriginal & priceOriginal.
  const rawPrice = (r.price as number) ?? 0
  const cur = (r.currency as string) === "GEL" ? "GEL" : "USD"
  const usd = cur === "USD"
  const priceGEL = usd ? Math.round(rawPrice * USD_GEL) : rawPrice
  const priceUSD = usd ? rawPrice : Math.round(rawPrice / USD_GEL)
  const perM2GEL = usd ? Math.round(((r.pricePerSqm as number) ?? 0) * USD_GEL) : ((r.pricePerSqm as number) ?? 0)
  const ext = (r.extendedFields as {
    project?: string
    floorType?: string
    kitchenArea?: number
    condition?: string
    projectCatalog?: boolean
    projectSlug?: string
  } | null) ?? null
  const projectCatalog = Boolean(ext?.projectCatalog)
  const projectSlug = ext?.projectSlug ?? null
  const agentRaw = (r.agent as {
    name?: string
    phone?: string
    agency?: string
    profileHref?: string | null
    role?: string
    verified?: boolean
  }) ?? {}
  const aiScore = (r.trustScore as number) ?? 70
  const createdAt = (r.createdAt as Date) ?? new Date()

  return {
    id: r.id as string,
    publicId: listingPublicId({ id: r.id as string, publicId: r.publicId as number | null | undefined }),
    img: ((r.images as string[]) ?? [])[0] ?? "/images/p1.webp",
    images: (r.images as string[]) ?? [],
    priceUSD,
    priceGEL,
    priceOriginal: rawPrice,
    currencyOriginal: cur,
    perM2USD: Math.round(perM2GEL / USD_GEL),
    title: (r.title as string) ?? "",
    address: (r.address as string) ?? "",
    city: (r.city as string) ?? "",
    district: (r.district as string) ?? "",
    dealType:
      (r.dealType as string) === "buy" ? "sale"
      : (r.dealType as string) === "mortgage" ? "pledge"
      : (r.dealType as string) === "rent" ? "rent"
      : "daily",
    propType: (["apartment", "house", "villa", "commercial", "land", "hotel"] as const).includes(
      r.propertyType as PropType,
    )
      ? (r.propertyType as PropType)
      : "apartment",
    rooms: (r.rooms as number) ?? 0,
    beds: (r.bedrooms as number) ?? 0,
    baths: (r.bathrooms as number) ?? 0,
    area: (r.area as number) ?? 0,
    floor: (r.floor as number) ?? 0,
    totalFloors: (r.totalFloors as number) ?? 0,
    views: (r.views as number) ?? 0,
    badge: dbTierToBadge(
      (r.tier as string) ?? "standard",
      (r.tierExpiresAt as Date | null | undefined) ?? null,
    ),
    highlighted: Boolean(
      activeColorUntil(
        (r.extendedFields as PromoExtFields | null) ?? null,
      ),
    ),
    stickerUrgent: Boolean(
      activeUrgentUntil((r.extendedFields as PromoExtFields | null) ?? null),
    ),
    stickerPriceDrop: Boolean(
      activePriceDropUntil((r.extendedFields as PromoExtFields | null) ?? null),
    ),
    inStory: Boolean(
      activeStoryUntil((r.extendedFields as PromoExtFields | null) ?? null),
    ),
    ai: {
      score: aiScore,
      label: aiLabel(aiScore, projectCatalog),
    },
    features: (r.features as string[]) ?? [],
    description: (r.description as string) ?? "",
    project: ext?.project ?? null,
    floorType: ext?.floorType ?? null,
    kitchenArea: ext?.kitchenArea ?? null,
    condition: ext?.condition ?? null,
    projectCatalog,
    projectSlug,
    coords: { lat: (r.lat as number) ?? MAP_CENTER.lat, lng: (r.lng as number) ?? MAP_CENTER.lng },
    postedAt: createdAt.toISOString().slice(0, 10),
    agent: {
      name: agentRaw.name ?? "სივრცე",
      // Never ship full phone in SSR/JS — reveal via /api/listings/[id]/phone
      phone: maskPhone(
        (r.listingPhone as string | null) || agentRaw.phone || "+995 555 00 00 00",
      ),
      agency: agentRaw.agency ?? "სივრცე პრემიუმ",
      role: agentRaw.role === "developer"
        ? "developer"
        : (r.sellerType as string) === "agency" ? "agency" : "owner",
      profileHref: agentRaw.profileHref ?? null,
      verified: Boolean(agentRaw.verified),
      image: null,
    },
    isNew: Date.now() - createdAt.getTime() < 7 * 86400000,
  }
}

/** Active listing counts keyed by district (neighborhoods index). */
export async function getDistrictListingCounts(): Promise<Record<string, number>> {
  return safeQuery(async () => {
    const rows = await db.listing.groupBy({
      by: ["district"],
      where: { deletedAt: null, status: "active" },
      _count: { _all: true },
    })
    const out: Record<string, number> = {}
    for (const r of rows) out[r.district] = r._count._all
    return out
  }, {})
}

/** Active listings in any of the given districts (neighborhood detail rail). */
export async function getListingsInDistricts(districts: string[], limit = 8): Promise<Listing[]> {
  if (districts.length === 0) return []
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: { deletedAt: null, status: "active", district: { in: districts } },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
  }, [])
}

/** Owner id for boost UI — not exposed on public Listing shape. */
export async function getListingOwnerMeta(
  id: string,
): Promise<{ ownerId: string; tier: string } | null> {
  return safeQuery(async () => {
    const publicNum = parseListingNumber(id)
    const row = await db.listing.findFirst({
      where: {
        deletedAt: null,
        status: "active",
        OR: publicNum ? [{ id }, { publicId: publicNum }] : [{ id }],
      },
      select: { ownerId: true, tier: true, tierExpiresAt: true },
    })
    if (!row?.ownerId) return null
    return { ownerId: row.ownerId, tier: effectiveTierKey(row.tier, row.tierExpiresAt) }
  }, null)
}

/** Get a single listing by string id OR public number. Returns null if not found. */
export async function getListing(id: string): Promise<Listing | null> {
  return safeQuery(async () => {
    const publicNum = parseListingNumber(id)
    const row = await db.listing.findFirst({
      where: {
        deletedAt: null,
        status: "active",
        OR: publicNum
          ? [{ id }, { publicId: publicNum }]
          : [{ id }],
      },
    })
    if (!row) return null
    const listing = rowToListing(row as unknown as Record<string, unknown>)
    const meta = await resolveOwnerProfile(row.ownerId, row.sellerType)
    listing.agent = {
      ...listing.agent,
      profileHref: meta.profileHref,
      role: meta.role,
      verified: meta.verified,
      image: meta.image,
    }
    return listing
  }, null)
}

/** Resolve by public number or agent phone digits → listing id for redirect. */
export async function resolveListingQuery(q: string): Promise<{ id: string; publicId: number } | null> {
  return safeQuery(async () => {
    const publicNum = parseListingNumber(q)
    if (publicNum) {
      const row = await db.listing.findFirst({
        where: { publicId: publicNum, deletedAt: null, status: "active" },
        select: { id: true, publicId: true },
      })
      if (row) return { id: row.id, publicId: row.publicId }
    }
    const phone = parsePhoneDigits(q)
    if (phone) {
      const row = await db.listing.findFirst({
        where: {
          deletedAt: null,
          status: "active",
          listingPhone: { contains: phone },
        },
        select: { id: true, publicId: true },
        orderBy: { createdAt: "desc" },
      })
      if (row) return { id: row.id, publicId: row.publicId }
    }
    return null
  }, null)
}

/** Active listings whose address matches a street core (Tbilisi street pages). */
export async function getListingsOnStreet(streetKa: string, districtKa: string): Promise<Listing[]> {
  return safeQuery(async () => {
    const core = streetKa.split(/\s+/).filter((w) => !/^(ქუჩა|გამზირი|ხეივანი|სანაპირო|მოედანი|გზატკეცილი)$/.test(w))
    const needle = core[core.length - 1] ?? streetKa
    const rows = await db.listing.findMany({
      where: {
        deletedAt: null,
        status: "active",
        city: "თბილისი",
        district: districtKa,
        address: { contains: needle, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: 48,
    })
    return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
  }, [])
}

/** Similar listings: same district+deal first, then same type+deal in city. */
export async function getSimilarListings(
  listing: Pick<Listing, "id" | "dealType" | "propType" | "city" | "district">,
  limit = 8,
): Promise<Listing[]> {
  return safeQuery(async () => {
    const deal = dealToDb(listing.dealType)
    const base = { deletedAt: null, status: "active" as const, id: { not: listing.id } }
    const districtRows = await db.listing.findMany({
      where: { ...base, dealType: deal, city: listing.city, district: listing.district },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    if (districtRows.length >= limit) {
      return districtRows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
    }
    const seen = new Set(districtRows.map((r) => r.id))
    const typeRows = await db.listing.findMany({
      where: {
        deletedAt: null,
        status: "active",
        dealType: deal,
        city: listing.city,
        propertyType: propToDb(listing.propType),
        id: { notIn: [listing.id, ...seen] },
      },
      orderBy: { createdAt: "desc" },
      take: limit - districtRows.length,
    })
    return [...districtRows, ...typeRows].map((r) =>
      rowToListing(r as unknown as Record<string, unknown>),
    )
  }, [])
}

/** Peer $/m² in the same district+deal for price scale (capped). */
export async function getDistrictPeerPerM2(
  city: string,
  district: string,
  dealType: DealType,
): Promise<number[]> {
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: {
        deletedAt: null,
        status: "active",
        city,
        district,
        dealType: dealToDb(dealType),
        pricePerSqm: { not: null, gt: 0 },
      },
      select: { pricePerSqm: true, currency: true },
      take: 200,
    })
    return rows.map((r) => {
      const p = r.pricePerSqm ?? 0
      // Match Listing.perM2USD units for priceScaleOf
      return r.currency === "USD" ? p : Math.round(p / USD_GEL)
    })
  }, [])
}

/** Active listings for a public seller profile (`/u/[id]`). */
export async function getListingsByOwner(ownerId: string): Promise<Listing[]> {
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: { ownerId, deletedAt: null, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 48,
    })
    return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
  }, [])
}

/**
 * Agent directory inventory — AgentProfile.ownerId first, else agent JSON name.
 * Empty = honest zero (no mock LISTINGS).
 */
export async function getListingsForAgentProfile(
  slug: string,
  kaName: string,
): Promise<Listing[]> {
  return safeQuery(async () => {
    const profile = await db.agentProfile.findFirst({
      where: { deletedAt: null, OR: [{ slug }, { name: kaName }] },
      select: { ownerId: true },
    })
    if (profile?.ownerId) {
      const rows = await db.listing.findMany({
        where: { ownerId: profile.ownerId, deletedAt: null, status: "active" },
        orderBy: { createdAt: "desc" },
        take: 48,
      })
      return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
    }
    const rows = await db.listing.findMany({
      where: {
        deletedAt: null,
        status: "active",
        agent: { path: ["name"], equals: kaName },
      },
      orderBy: { createdAt: "desc" },
      take: 48,
    })
    return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
  }, [])
}

/** Counts for /agents index cards — keyed by Georgian agent name. */
export async function getAgentListingCountsByKaName(): Promise<Record<string, number>> {
  return safeQuery(async () => {
    const [rows, profiles] = await Promise.all([
      db.listing.findMany({
        where: { deletedAt: null, status: "active" },
        select: { agent: true, ownerId: true },
        take: 2500,
      }),
      db.agentProfile.findMany({
        where: { deletedAt: null },
        select: { name: true, ownerId: true },
      }),
    ])
    const out: Record<string, number> = {}
    const byOwner = new Map<string, number>()
    for (const r of rows) {
      const name = (r.agent as { name?: string } | null)?.name?.trim()
      if (name) out[name] = (out[name] ?? 0) + 1
      if (r.ownerId) byOwner.set(r.ownerId, (byOwner.get(r.ownerId) ?? 0) + 1)
    }
    for (const p of profiles) {
      if (!p.ownerId) continue
      const n = byOwner.get(p.ownerId) ?? 0
      if (n > 0) out[p.name] = Math.max(out[p.name] ?? 0, n)
    }
    return out
  }, {})
}

/**
 * Listings tied to a project: extendedFields.projectSlug or catalog id prefix.
 * Empty = honest zero (no city-wide mock filler).
 */
export async function getListingsForProjectSlug(
  slug: string,
  limit = 6,
): Promise<Listing[]> {
  if (!slug) return []
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: {
        deletedAt: null,
        status: "active",
        OR: [
          { extendedFields: { path: ["projectSlug"], equals: slug } },
          { id: { startsWith: `proj-${slug}` } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
  }, [])
}

/**
 * Developer page rail — owner ads + ads on that developer's project slugs.
 * ponytail: pass projectSlugs from page (already loaded); no second directory fetch.
 */
export async function getListingsForDeveloper(
  slug: string,
  projectSlugs: string[],
  limit = 6,
): Promise<Listing[]> {
  return safeQuery(async () => {
    const profile = await db.developerProfile.findFirst({
      where: { slug, deletedAt: null },
      select: { ownerId: true },
    })
    const or: Prisma.ListingWhereInput[] = []
    if (profile?.ownerId) or.push({ ownerId: profile.ownerId })
    for (const s of projectSlugs.slice(0, 24)) {
      or.push({ extendedFields: { path: ["projectSlug"], equals: s } })
      or.push({ id: { startsWith: `proj-${s}` } })
    }
    if (or.length === 0) return []
    const rows = await db.listing.findMany({
      where: { deletedAt: null, status: "active", OR: or },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
  }, [])
}

/** Get active listings (homepage carousel, sitemap). */
export async function getAllListings(limit = 50): Promise<Listing[]> {
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: { deletedAt: null, status: "active" },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 5000),
    })
    return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
  }, [])
}

/**
 * Homepage SUPER VIP rail — real ads with photos, not project-catalog inquiry cards.
 * ponytail: id prefix filter; JSON path on extendedFields when catalog volume drops.
 */
export async function getFeaturedListings(limit = 6): Promise<Listing[]> {
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: {
        deletedAt: null,
        status: "active",
        NOT: { id: { startsWith: "proj-" } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 80,
    })
    const mapped = rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
    const rank = (l: Listing) =>
      (l.badge === "SUPER VIP" ? 40 : l.badge === "VIP+" ? 25 : l.badge === "VIP" ? 15 : 0) +
      Math.min(l.images.length, 4)
    return [...mapped].sort((a, b) => rank(b) - rank(a)).slice(0, limit)
  }, [])
}

/**
 * Active Stories rail — paid `storyUntil` still in the future.
 * ponytail: scan recent actives in memory; JSON path index when story volume is high.
 */
export async function getStoryListings(limit = 24): Promise<Listing[]> {
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: { deletedAt: null, status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 200,
    })
    const out: Listing[] = []
    for (const r of rows) {
      if (!activeStoryUntil((r.extendedFields as PromoExtFields | null) ?? null)) continue
      out.push(rowToListing(r as unknown as Record<string, unknown>))
      if (out.length >= limit) break
    }
    return out
  }, [])
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

  const rows = await safeQuery(
    () =>
      db.listing.findMany({
        where,
        orderBy,
        take: 100,
      }),
    [],
  )
  // Default date sort: paid tiers first (Meilisearch path does the same via tierRank).
  const ordered =
    !opts.sort || opts.sort === "date"
      ? [...rows].sort(
          (a, b) =>
            tierRankOf(b.tier, b.tierExpiresAt) - tierRankOf(a.tier, a.tierExpiresAt) ||
            b.createdAt.getTime() - a.createdAt.getTime(),
        )
      : rows
  return ordered.map((r) => rowToListing(r as unknown as Record<string, unknown>))
}

/** Distinct cities with active listings. */
export async function getCities(): Promise<string[]> {
  const rows = await safeQuery(
    () =>
      db.listing.findMany({
        where: { deletedAt: null, status: "active" },
        select: { city: true },
        distinct: ["city"],
        orderBy: { city: "asc" },
      }),
    [],
  )
  return rows.map((r) => r.city)
}

/** Districts for a given city with active listings. */
export async function getDistricts(city: string): Promise<string[]> {
  const rows = await safeQuery(
    () =>
      db.listing.findMany({
        where: { city, deletedAt: null, status: "active" },
        select: { district: true },
        distinct: ["district"],
        orderBy: { district: "asc" },
      }),
    [],
  )
  return rows.map((r) => r.district)
}

// ---- Search location facets (live city/district dropdowns) ----

export interface SearchLocations {
  cities: string[]
  districts: Record<string, string[]>
}

/** Cities + districts that actually have active listings; cached 5 min. */
const readSearchLocations = unstable_cache(
  async (): Promise<SearchLocations | null> =>
    safeQuery(async () => {
      const rows = await db.listing.groupBy({
        by: ["city", "district"],
        where: { deletedAt: null, status: "active" },
        orderBy: [{ city: "asc" }, { district: "asc" }],
      })
      const districts: Record<string, string[]> = {}
      for (const r of rows) (districts[r.city] ??= []).push(r.district)
      return { cities: Object.keys(districts), districts }
    }, null),
  ["search-locations"],
  { revalidate: 300 },
)

/** Live locations when the DB answers; static mock catalog as fallback. */
export async function getSearchLocations(): Promise<SearchLocations> {
  const live = await readSearchLocations()
  if (live && live.cities.length > 0) return live
  const districts: Record<string, string[]> = {}
  for (const c of CITIES) districts[c] = districtsOf(c)
  return { cities: [...CITIES], districts }
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
