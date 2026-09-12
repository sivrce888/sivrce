import { searchListings, type SearchFilters } from "@/lib/search"
import { USD_GEL } from "@/data/listings"
// ponytail: mirrors EUR_GEL_FALLBACK in lib/currency.tsx ('use client', can't import here); unify when rates move server-side
const EUR_GEL = 3.04
import { db } from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"
import { buildDbWhere, parseSearchParams } from "@/lib/search-filters"
import {
  activeColorUntil,
  activePriceDropUntil,
  activeStoryUntil,
  activeUrgentUntil,
  effectiveTierKey,
} from "@/lib/promo-pricing"
import { METRO_NEAR_M, nearestMetro } from "@/lib/map/pois"
import { worldMetroChip, worldMetroMeters } from "@/lib/countries/world-metro-all"
import { collapseHits, type CollapseHit } from "@/lib/trust/dedupe-collapse"
import { listingIdsInBbox } from "@/lib/geo/postgis"
import { isExactLookupQuery } from "@/lib/listing-public-id"
import { cardPhotoPayload } from "@/lib/card-gallery-teaser"
import { streetHrefForListing } from "@/lib/street-href"

export const maxDuration = 15

// buildDbWhere + parseSearchParams live in @/lib/search-filters — shared with
// the saved-search alert matcher so alerts evaluate the exact search semantics.

function buildDbOrderBy(filters: SearchFilters): Prisma.ListingOrderByWithRelationInput {
  switch (filters.sort) {
    case "area":
      return { area: "desc" }
    case "ai":
      return { trustScore: "desc" }
    case "price-asc":
    case "price-desc":
    case "m2asc":
    case "m2desc":
      // Currency-normalized in memory below — Prisma can't ORDER BY CASE easily.
      return { createdAt: "desc" }
    case "date":
    default:
      return { createdAt: "desc" }
  }
}

function priceUsd(l: { price: number; currency: string }): number {
  if (l.currency === "GEL") return l.price / USD_GEL
  if (l.currency === "EUR") return (l.price * EUR_GEL) / USD_GEL
  return l.price
}

function m2Usd(l: { pricePerSqm: number | null; currency: string }): number {
  const m2 = l.pricePerSqm ?? 0
  if (l.currency === "GEL") return m2 / USD_GEL
  if (l.currency === "EUR") return (m2 * EUR_GEL) / USD_GEL
  return m2
}

function sortHits<T extends {
  price: number
  currency: string
  pricePerSqm: number | null
  createdAt: Date
  area?: number
  trustScore?: number | null
}>(rows: T[], sort: SearchFilters["sort"]): T[] {
  const copy = [...rows]
  copy.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return priceUsd(a) - priceUsd(b)
      case "price-desc":
        return priceUsd(b) - priceUsd(a)
      case "m2asc":
        return m2Usd(a) - m2Usd(b)
      case "m2desc":
        return m2Usd(b) - m2Usd(a)
      case "area":
        return (b.area ?? 0) - (a.area ?? 0)
      case "ai":
        return (b.trustScore ?? 0) - (a.trustScore ?? 0)
      case "date":
      default:
        return b.createdAt.getTime() - a.createdAt.getTime()
    }
  })
  return copy
}

const LISTING_SELECT = {
  id: true,
  title: true,
  city: true,
  district: true,
  address: true,
  dealType: true,
  propertyType: true,
  price: true,
  currency: true,
  pricePerSqm: true,
  area: true,
  rooms: true,
  bedrooms: true,
  bathrooms: true,
  floor: true,
  totalFloors: true,
  lat: true,
  lng: true,
  images: true,
  slug: true,
  views: true,
  tier: true,
  tierExpiresAt: true,
  trustScore: true,
  verified: true,
  features: true,
  createdAt: true,
  agent: true,
  extendedFields: true,
} satisfies Prisma.ListingSelect

/**
 * Fold same-flat reposts on this page into representative hits (one indexed
 * query; no-op when the dedupe cron found nothing). Recents rail skips this —
 * explicitly saved posts are never hidden.
 */
async function collapseSearchDupes<T extends CollapseHit>(hits: T[]): Promise<(T & { dupeCount?: number })[]> {
  if (hits.length < 2) return hits
  try {
    const members = await db.duplicateClusterMember.findMany({
      where: { listingId: { in: hits.map((h) => h.id) } },
      include: { cluster: { select: { memberCount: true } } },
    })
    if (!members.length) return hits
    const clusterOf = new Map(
      members.map((m) => [m.listingId, { clusterId: m.clusterId, memberCount: m.cluster.memberCount }]),
    )
    return collapseHits(hits, clusterOf).hits
  } catch {
    return hits // ponytail: search never fails because dedupe did
  }
}

async function dbSearch(filters: SearchFilters) {
  const page = Math.max(1, filters.page ?? 1)
  // Cap 100: the /search map view pulls the first 100 matches for pins.
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 24))

  try {
    const where = buildDbWhere(filters)
    const orderBy = buildDbOrderBy(filters)
    // Always demote catalog + normalize currency sorts in memory (≤2k ceiling).
    // ponytail: Meili is the real path. Upgrade: generated columns / PostGIS.
    const rows = await db.listing.findMany({
      where,
      orderBy,
      take: 2000,
      select: LISTING_SELECT,
    })
    let list = rows
    if (filters.nearMetro) {
      list = list.filter((l) => {
        const n = nearestMetro(l.lat, l.lng)
        // Tbilisi grid is O(1); the 18k world scan runs only on its misses.
        const meters = n ? n.meters : worldMetroMeters(l.lat, l.lng)
        return meters <= METRO_NEAR_M
      })
    }
    list = sortHits(list, filters.sort)
    const slice = list.slice((page - 1) * pageSize, page * pageSize)
    // Same-flat reposts (owner + agents) fold into one representative card.
    const collapsed = await collapseSearchDupes(slice)
    return {
      hits: collapsed.map(mapDbHit),
      totalHits: list.length,
      page,
      pageSize,
      totalPages: Math.ceil(list.length / pageSize),
      source: "db" as const,
    }
  } catch (e) {
    console.error("[api/search] DB fallback failed:", (e as Error).message)
    return {
      hits: [],
      totalHits: 0,
      page,
      pageSize,
      totalPages: 0,
      source: "db" as const,
      error: "db_error",
    }
  }
}

function mapDbHit(
  l: Prisma.ListingGetPayload<{ select: typeof LISTING_SELECT }>,
) {
  const ext = l.extendedFields as {
    colorUntil?: string
    urgentUntil?: string
    priceDropUntil?: string
    storyUntil?: string
    projectCatalog?: boolean
    projectSlug?: string
    condition?: string
    exclusive?: boolean
    sivrceExclusive?: boolean
    video?: string
  } | null
  const photos = cardPhotoPayload((l.images as string[]) ?? [])
  const gridMetro = nearestMetro(l.lat, l.lng)
  // Server chip: world metro on every card, zero client bytes (client keeps
  // its Tbilisi-only compute as fallback for static/local listings).
  const metroNear = gridMetro
    ? { n: gridMetro.name, m: gridMetro.meters, w: gridMetro.walkMin }
    : worldMetroChip(l.lat, l.lng)
  return {
    ...l,
    metroNear,
    streetHref: streetHrefForListing(l.address, l.district, l.city),
    images: photos.images,
    photoCount: photos.photoCount,
    dealType: l.dealType === "buy" ? "sale" : l.dealType === "mortgage" ? "pledge" : l.dealType,
    agent: l.agent as unknown,
    colorUntil: activeColorUntil(ext),
    urgentUntil: activeUrgentUntil(ext),
    priceDropUntil: activePriceDropUntil(ext),
    storyUntil: activeStoryUntil(ext),
    projectCatalog: Boolean(ext?.projectCatalog),
    projectSlug: ext?.projectSlug ?? null,
    condition: ext?.condition ?? null,
    exclusive: ext?.exclusive === true,
    sivrceExclusive: ext?.sivrceExclusive === true,
    video: typeof ext?.video === "string" && ext.video ? ext.video : undefined,
    tier: effectiveTierKey(l.tier, l.tierExpiresAt),
  }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

// Anonymous, URL-keyed responses: cache at the edge for 30s. Shields DB/Meili
// from scrapers and repeat keystrokes; new listings appear within a minute.
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "Vercel-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sp = url.searchParams

  // Fetch-by-ids (recently-viewed rail). Skips Meilisearch — direct DB lookup,
  // order follows the ids array, capped to keep the URL and query small.
  const idsParam = sp.get("ids")
  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12)
    try {
      const rows = await db.listing.findMany({
        where: { id: { in: ids }, deletedAt: null, status: "active" },
        select: LISTING_SELECT,
      })
      const byId = new Map(rows.map((r) => [r.id, r]))
      const hits = ids.flatMap((id) => {
        const row = byId.get(id)
        return row ? [mapDbHit(row)] : []
      })
      return Response.json({ ok: true, hits, totalHits: hits.length, page: 1, pageSize: hits.length, totalPages: 1, source: "db" }, { headers: CACHE_HEADERS })
    } catch (e) {
      console.error("[api/search] ids lookup failed:", (e as Error).message)
      return Response.json({ ok: true, hits: [], totalHits: 0, page: 1, pageSize: 0, totalPages: 0, source: "db" }, { headers: CACHE_HEADERS })
    }
  }

  const filters = parseSearchParams(sp)

  // Map viewport → PostGIS ids, then DB path (Meili has no geo filter wired yet).
  if (filters.bbox) {
    try {
      filters.idsIn = await listingIdsInBbox(filters.bbox, 500)
    } catch (e) {
      console.error("[api/search] bbox lookup failed:", (e as Error).message)
      filters.idsIn = []
    }
    const dbResult = await dbSearch(filters)
    return Response.json({ ok: true, ...dbResult }, { headers: CACHE_HEADERS })
  }

  // Date-availability + ID/phone/cadastral need Postgres (Meili has no phone/cad index).
  const meiliResult =
    (filters.dailyFrom && filters.dailyTo) || (filters.q && isExactLookupQuery(filters.q))
      ? null
      : await searchListings(filters)
  if (meiliResult && meiliResult.totalHits > 0) {
    meiliResult.hits = await collapseSearchDupes(meiliResult.hits)
    return Response.json({ ok: true, ...meiliResult, source: "meilisearch" }, { headers: CACHE_HEADERS })
  }

  const dbResult = await dbSearch(filters)
  return Response.json({ ok: true, ...dbResult }, { headers: CACHE_HEADERS })
}
