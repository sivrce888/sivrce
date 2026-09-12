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
import { CONTACT_PHONE } from "@/lib/inquiries/phone"
import { unstable_cache } from "next/cache"
import { CITIES, districtsOf } from "@/data/listings"
import type { ListingDealType, ListingPropertyType } from "@/generated/prisma/enums"
import { Prisma } from "@/generated/prisma/client"
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
import { priceEventViews, type PriceEventView } from "@/lib/price-scale"
import { MAP_CENTER } from "@/lib/map/map-geo"
import { maskPhone } from "@/lib/inquiries/phone"
import { resolveOwnerProfile } from "@/lib/profiles/public"
import { streetHrefForListing } from "@/lib/street-href"
import { rankPeers } from "@/lib/peer-rank"
import type { SellerRole } from "@/lib/profiles/roles"
import {
  cadastralVariants,
  listingPublicId,
  parseCadastralCode,
  parseListingNumber,
  phoneSearchNeedles,
} from "@/lib/listing-public-id"
import { HOME_RAIL_BADGE, pickHomeRail, type HomeRailTier } from "@/lib/listings-home-rail"
import { homeScopeWhere, type HomeScope } from "@/lib/home-scope"

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
  /** ISO country of the listing ('GE' default) — drives canonical origin + sitemap shard. */
  country?: string
  /** Street SEO hub link — precomputed here so the street catalog stays server-side. */
  streetHref?: string | null
  img: string
  images: string[]
  /** Full gallery size. Set when `images` is a 4-frame card teaser. */
  photoCount?: number
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
  isExclusive?: boolean
  isSivrceExclusive?: boolean
  highlighted?: boolean
  stickerUrgent?: boolean
  stickerPriceDrop?: boolean
  inStory?: boolean
  /** YouTube or CDN mp4/webm/mov — extendedFields.video */
  video?: string | null
  verified?: boolean
  /** Official NAPR cadastral code attached (extendedFields.cadastral) — fraud-radar trust signal. */
  hasCadastralCode?: boolean
  ai: { score: number; label: string }
  features: string[]
  description: string
  project?: string | null
  floorType?: string | null
  kitchenArea?: number | null
  yardArea?: number | null
  condition?: string | null
  buildingStatus?: string | null
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
    yardArea?: number
    condition?: string
    buildingStatus?: string
    projectCatalog?: boolean
    projectSlug?: string
    exclusive?: boolean
    sivrceExclusive?: boolean
    video?: string
    cadastral?: string
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
  // Precomputed street SEO link — keeps the 740KB street catalog server-side.
  const streetHref = streetHrefForListing(
    (r.address as string) ?? "",
    (r.district as string) ?? "",
    (r.city as string) ?? "",
  )

  return {
    id: r.id as string,
    country: (r.country as string) || "GE",
    streetHref,
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
    isExclusive: ext?.exclusive === true,
    isSivrceExclusive: ext?.sivrceExclusive === true,
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
    video: typeof ext?.video === "string" && ext.video ? ext.video : null,
    verified: Boolean(r.verified),
    hasCadastralCode: Boolean(ext?.cadastral),
    ai: {
      score: aiScore,
      label: aiLabel(aiScore),
    },
    features: (r.features as string[]) ?? [],
    description: (r.description as string) ?? "",
    project: ext?.project ?? null,
    floorType: ext?.floorType ?? null,
    kitchenArea: ext?.kitchenArea ?? null,
    yardArea: ext?.yardArea ?? null,
    condition: ext?.condition ?? null,
    buildingStatus: ext?.buildingStatus ?? null,
    projectCatalog,
    projectSlug,
    coords: { lat: (r.lat as number) ?? MAP_CENTER.lat, lng: (r.lng as number) ?? MAP_CENTER.lng },
    postedAt: createdAt.toISOString().slice(0, 10),
    agent: {
      name: agentRaw.name ?? "სივრცე",
      // Never ship full phone in SSR/JS — reveal via /api/listings/[id]/phone.
      // Mask fallback mirrors resolveListingPhone (masked agent.phone and
      // numberless rows both resolve to the switchboard) so the masked prefix
      // always matches the number a buyer reveals.
      phone: maskPhone(
        (r.listingPhone as string | null) ||
          (typeof agentRaw.phone === 'string' && !agentRaw.phone.includes('*')
            ? agentRaw.phone
            : null) ||
          CONTACT_PHONE,
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
const readDistrictCounts = unstable_cache(
  async (country: string): Promise<Record<string, number>> =>
    safeQuery(async () => {
      const rows = await db.listing.groupBy({
        by: ["district"],
        where: { deletedAt: null, status: "active", country },
        _count: { _all: true },
      })
      const out: Record<string, number> = {}
      for (const r of rows) out[r.district] = r._count._all
      return out
    }, {}),
  ["district-listing-counts-v2"],
  { revalidate: 300 },
)

export async function getDistrictListingCounts(country = "GE"): Promise<Record<string, number>> {
  return readDistrictCounts(country)
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

const LOOKUP_SELECT = { id: true, publicId: true } as const
const LOOKUP_BASE = { deletedAt: null, status: "active" as const }

/** Phone: listingPhone + agent.phone, formatted or digits. take 2 = unique vs many. */
function phoneLookupWhere(q: string): Prisma.ListingWhereInput | null {
  const needles = phoneSearchNeedles(q)
  if (!needles.length) return null
  return {
    ...LOOKUP_BASE,
    OR: needles.flatMap((n) => [
      { listingPhone: { contains: n } },
      { agent: { path: ["phone"], string_contains: n } },
    ]),
  }
}

function cadastralLookupWhere(q: string): Prisma.ListingWhereInput | null {
  if (!parseCadastralCode(q)) return null
  return {
    ...LOOKUP_BASE,
    OR: cadastralVariants(q).map((v) => ({
      extendedFields: { path: ["cadastral"], equals: v },
    })),
  }
}

async function firstOrMany(
  where: Prisma.ListingWhereInput,
): Promise<{ id: string; publicId: number; count: number } | null> {
  const rows = await db.listing.findMany({
    where,
    select: LOOKUP_SELECT,
    orderBy: { createdAt: "desc" },
    take: 2,
  })
  const row = rows[0]
  if (!row) return null
  return { id: row.id, publicId: row.publicId, count: rows.length }
}

/** Resolve by phone, public number, or cadastral. count 2 = more exist (don't jump). */
export async function resolveListingQuery(
  q: string,
): Promise<{ id: string; publicId: number; count: number } | null> {
  return safeQuery(async () => {
    const phoneWhere = phoneLookupWhere(q)
    if (phoneWhere) return firstOrMany(phoneWhere)

    const publicNum = parseListingNumber(q)
    if (publicNum) {
      const row = await db.listing.findFirst({
        where: { ...LOOKUP_BASE, publicId: publicNum },
        select: LOOKUP_SELECT,
      })
      if (row) return { id: row.id, publicId: row.publicId, count: 1 }
    }

    const cadWhere = cadastralLookupWhere(q)
    if (cadWhere) return firstOrMany(cadWhere)

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

/**
 * Active listings within walking radius of a point (Tbilisi metro station pages).
 * Bounding-box WHERE keeps the scan index-friendly; haversine trims the corners.
 */
export async function getListingsNearMetro(lat: number, lng: number, radiusM = 1200): Promise<Listing[]> {
  const dLat = radiusM / 111_320
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180))
  const rad = Math.PI / 180
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: {
        deletedAt: null,
        status: "active",
        city: "თბილისი",
        lat: { gte: lat - dLat, lte: lat + dLat },
        lng: { gte: lng - dLng, lte: lng + dLng },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
    const R = 6_371_000
    const near = rows.filter((r) => {
      const aLat = (r.lat - lat) * rad
      const aLng = (r.lng - lng) * rad
      const h =
        Math.sin(aLat / 2) ** 2 +
        Math.cos(lat * rad) * Math.cos(r.lat * rad) * Math.sin(aLng / 2) ** 2
      return 2 * R * Math.asin(Math.sqrt(h)) <= radiusM
    })
    return near.slice(0, 48).map((r) => rowToListing(r as unknown as Record<string, unknown>))
  }, [])
}

/** Similar listings: same district+deal first, then same type+deal in city. */
export async function getSimilarListings(
  listing: Pick<
    Listing,
    "id" | "dealType" | "propType" | "city" | "district" | "address" | "area" | "rooms" | "beds" | "priceUSD" | "perM2USD" | "coords"
  >,
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
      // Newest-in-district in, best comps first out — zero extra queries.
      return rankPeers(
        listing,
        districtRows.map((r) => rowToListing(r as unknown as Record<string, unknown>)),
      ).slice(0, limit)
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
    return rankPeers(
      listing,
      [...districtRows, ...typeRows].map((r) => rowToListing(r as unknown as Record<string, unknown>)),
    ).slice(0, limit)
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

/** Price timeline for the listing detail page (newest first, capped). */
export async function getListingPriceEvents(listingId: string): Promise<PriceEventView[]> {
  return safeQuery(async () => {
    const rows = await db.listingPriceEvent.findMany({
      where: { listingId },
      orderBy: { recordedAt: "desc" },
      take: 12,
    })
    return priceEventViews(
      rows.map((r) => ({
        eventType: r.eventType as string,
        price: r.price,
        previousPrice: r.previousPrice,
        currency: r.currency as string,
        recordedAt: r.recordedAt,
      })),
      USD_GEL,
    )
  }, [])
}
export async function getListingsByOwner(ownerId: string | string[]): Promise<Listing[]> {
  const ids = (Array.isArray(ownerId) ? ownerId : [ownerId]).filter(Boolean)
  if (!ids.length) return []
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: { ownerId: { in: ids }, deletedAt: null, status: "active" },
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
const readAgentListingCounts = unstable_cache(
  async (): Promise<Record<string, number>> =>
    safeQuery(async () => {
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
    }, {}),
  ["agent-listing-counts"],
  { revalidate: 300 },
)

export async function getAgentListingCountsByKaName(): Promise<Record<string, number>> {
  return readAgentListingCounts()
}

/**
 * Active listing counts keyed by developer slug.
 * `projectToDev`: projectSlug → developerSlug (from live/static catalog).
 * ponytail: scan cap 2500; Meilisearch facet when inventory > that.
 */
export async function getDeveloperListingCountsBySlug(
  projectToDev: Map<string, string>,
): Promise<Record<string, number>> {
  if (projectToDev.size === 0) return {}
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: { deletedAt: null, status: "active" },
      select: { extendedFields: true },
      take: 2500,
    })
    const out: Record<string, number> = {}
    for (const r of rows) {
      const slug = (r.extendedFields as { projectSlug?: string } | null)?.projectSlug
      if (!slug) continue
      const ds = projectToDev.get(slug)
      if (ds) out[ds] = (out[ds] ?? 0) + 1
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

import { PROJECTS } from "@/data/professionals"
import { cityByName, nearestMapCity } from "@/lib/map/user-place"

/** Convert static project catalog entries to high-quality Listing objects when DB inventory is empty. */
export function getProjectCatalogListings(scope?: HomeScope | null, limit = 8): Listing[] {
  // '*' (worldwide hub) is not a country — the catalog fallback stays unfiltered.
  const targetCountry = scope?.country === "*" ? undefined : scope?.country?.toUpperCase()
  const cityNames = scope?.cityNames?.map((c) => c.toLowerCase())

  const matches = PROJECTS.filter((p) => {
    if (targetCountry) {
      const pin = cityByName(p.city)
      const cc = pin?.cc ?? (p.coords ? nearestMapCity(p.coords.lat, p.coords.lng)?.cc : null)
      if (cc !== targetCountry) return false
    }
    if (cityNames?.length) {
      const pCity = p.city.toLowerCase()
      const pDistrict = p.district?.toLowerCase()
      const matchCity = cityNames.some((cn) => pCity.includes(cn) || (pDistrict && pDistrict.includes(cn)))
      if (!matchCity) return false
    }
    return true
  })

  const pool = matches.length > 0 ? matches : targetCountry ? PROJECTS.filter((p) => {
    const pin = cityByName(p.city)
    return (pin?.cc ?? (p.coords ? nearestMapCity(p.coords.lat, p.coords.lng)?.cc : null)) === targetCountry
  }) : PROJECTS

  return pool.slice(0, limit).map((p, i) => {
    const rawM2 = typeof p.priceFromM2 === "number" ? p.priceFromM2 : parseInt(String(p.priceFromM2), 10) || 1600
    const priceUSD = rawM2 * 55
    const priceGEL = Math.round(priceUSD * USD_GEL)
    const desc = typeof p.description === "string" ? p.description : p.description?.en || p.name
    return {
      id: `proj-${p.slug}`,
      publicId: 90000000 + i,
      streetHref: null,
      img: p.img || "/images/p1.webp",
      images: [p.img || "/images/p1.webp"],
      priceUSD,
      priceGEL,
      priceOriginal: priceUSD,
      currencyOriginal: "USD" as const,
      perM2USD: rawM2,
      title: `${p.name} — ${p.city}`,
      address: p.location || `${p.district || p.city}`,
      city: p.city,
      district: p.district || p.city,
      dealType: (scope?.deal ?? "sale") as DealType,
      propType: "apartment" as PropType,
      rooms: 2,
      beds: 2,
      baths: 1,
      area: 55,
      floor: 3,
      totalFloors: 8,
      views: 150 + i * 12,
      badge: "diamond" as Badge,
      verified: true,
      ai: { score: 95, label: "სივრცე VERIFIED" },
      features: ["ახალი მშენებლობა", "პროექტი"],
      description: desc,
      project: p.name,
      projectCatalog: true,
      projectSlug: p.slug,
      coords: p.coords || { lat: MAP_CENTER.lat, lng: MAP_CENTER.lng },
      postedAt: new Date().toISOString().slice(0, 10),
      agent: {
        name: p.developerSlug || "სივრცე",
        phone: CONTACT_PHONE,
        agency: "Developer",
        role: "developer" as const,
        verified: true,
      },
      isNew: true,
    }
  })
}

/**
 * Get active listings (homepage carousel, sitemap). Optional market scope.
 * ponytail: NOT-filter needs its own read — homeScopeWhere can't express it.
 */
export async function getWorldListings(limit = 3000): Promise<Listing[]> {
  return safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: { deletedAt: null, status: "active", country: { not: "GE" } },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 5000),
    })
    return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
  }, [])
}

export async function getAllListings(limit = 50, scope?: HomeScope | null): Promise<Listing[]> {
  const live = await safeQuery(async () => {
    const rows = await db.listing.findMany({
      where: { deletedAt: null, status: "active", ...homeScopeWhere(scope) },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 5000),
    })
    return rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
  }, [])
  if (live.length > 0) return live
  return getProjectCatalogListings(scope, limit)
}

/**
 * Homepage SUPER VIP / VIP+ rails — live paid ads with photos.
 * ponytail: id prefix filter; JSON path on extendedFields when catalog volume drops.
 */
const readHomeTierListings = unstable_cache(
  async (tier: HomeRailTier, limit: number, country: string, cityKey: string, deal: string): Promise<Listing[]> =>
    safeQuery(async () => {
      const now = new Date()
      const scope: HomeScope | null = country
        ? {
            country,
            cityNames: cityKey ? cityKey.split("|") : undefined,
            deal: deal === "buy" || deal === "rent" ? deal : undefined,
          }
        : null
      const rows = await db.listing.findMany({
        where: {
          deletedAt: null,
          status: "active",
          tier,
          NOT: { id: { startsWith: "proj-" } },
          OR: [{ tierExpiresAt: null }, { tierExpiresAt: { gt: now } }],
          ...homeScopeWhere(scope),
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 40,
      })
      const mapped = rows.map((r) => rowToListing(r as unknown as Record<string, unknown>))
      const rail = pickHomeRail(mapped, HOME_RAIL_BADGE[tier], limit)
      if (rail.length > 0) return rail
      return getProjectCatalogListings(scope, limit)
    }, []),
  ["home-tier-listings-v3"],
  { revalidate: 60 },
)

export async function getHomeTierListings(
  tier: HomeRailTier,
  limit = 8,
  scope?: HomeScope | null,
): Promise<Listing[]> {
  return readHomeTierListings(
    tier,
    limit,
    scope?.country ?? "",
    scope?.cityNames?.join("|") ?? "",
    scope?.deal ?? "",
  )
}

const readStoryListings = unstable_cache(
  async (limit: number, country: string, cityKey: string, deal: string): Promise<Listing[]> =>
    safeQuery(async () => {
      const scope: HomeScope | null = country
        ? {
            country,
            cityNames: cityKey ? cityKey.split("|") : undefined,
            deal: deal === "buy" || deal === "rent" ? deal : undefined,
          }
        : null
      const rows = await db.listing.findMany({
        where: { deletedAt: null, status: "active", ...homeScopeWhere(scope) },
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
    }, []),
  ["story-listings-v2"],
  { revalidate: 300 },
)

export async function getStoryListings(limit = 24, scope?: HomeScope | null): Promise<Listing[]> {
  return readStoryListings(limit, scope?.country ?? "", scope?.cityNames?.join("|") ?? "", scope?.deal ?? "")
}

const readVideoListings = unstable_cache(
  async (limit: number, country: string, cityKey: string, deal: string): Promise<Listing[]> =>
    safeQuery(async () => {
      const scope: HomeScope | null = country
        ? {
            country,
            cityNames: cityKey ? cityKey.split("|") : undefined,
            deal: deal === "buy" || deal === "rent" ? deal : undefined,
          }
        : null
      const rows = await db.listing.findMany({
        where: {
          deletedAt: null,
          status: "active",
          NOT: { id: { startsWith: "proj-" } },
          extendedFields: { path: ["video"], string_starts_with: "http" },
          ...homeScopeWhere(scope),
        },
        orderBy: { updatedAt: "desc" },
        take: Math.min(40, Math.max(1, limit)),
      })
      return rows
        .map((r) => rowToListing(r as unknown as Record<string, unknown>))
        .filter((l) => l.video)
    }, []),
  ["video-listings-v2"],
  { revalidate: 60 },
)

export async function getVideoListings(limit = 16, scope?: HomeScope | null): Promise<Listing[]> {
  return readVideoListings(limit, scope?.country ?? "", scope?.cityNames?.join("|") ?? "", scope?.deal ?? "")
}

/** Filtered search — mirrors data/listings.ts filterListings(). */
export async function filterListings(opts: {
  dealType?: DealType
  propType?: PropType
  city?: string
  district?: string
  country?: string
  rooms?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  q?: string
  sort?: SortKey
  includeProjects?: boolean
}): Promise<Listing[]> {
  const where: Prisma.ListingWhereInput = {
    deletedAt: null,
    status: "active",
  }
  if (opts.country) where.country = opts.country

  if (!opts.includeProjects) {
    // Same as buildDbWhere — NOT(path=true) drops missing-key rows on PG JSONB.
    where.AND = [
      {
        OR: [
          { extendedFields: { path: ["projectCatalog"], equals: false } },
          { extendedFields: { path: ["projectCatalog"], equals: Prisma.DbNull } },
        ],
      },
    ]
  }

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
