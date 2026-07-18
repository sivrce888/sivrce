import { searchListings, type SearchFilters } from "@/lib/search"
import { db } from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"
import { buildDbWhere, parseSearchParams } from "@/lib/search-filters"
import { effectiveTierKey } from "@/lib/promo-pricing"

// buildDbWhere + parseSearchParams live in @/lib/search-filters — shared with
// the saved-search alert matcher so alerts evaluate the exact search semantics.

function buildDbOrderBy(filters: SearchFilters): Prisma.ListingOrderByWithRelationInput {
  switch (filters.sort) {
    case "price-asc":
      return { price: "asc" }
    case "price-desc":
      return { price: "desc" }
    case "area":
      return { area: "desc" }
    case "ai":
      return { trustScore: "desc" }
    case "m2asc":
      return { pricePerSqm: "asc" }
    case "m2desc":
      return { pricePerSqm: "desc" }
    case "date":
    default:
      return { createdAt: "desc" }
  }
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
  createdAt: true,
  agent: true,
  extendedFields: true,
} satisfies Prisma.ListingSelect

async function dbSearch(filters: SearchFilters) {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 24))

  try {
    const where = buildDbWhere(filters)
    const orderBy = buildDbOrderBy(filters)

    const [hits, totalHits] = await Promise.all([
      db.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: LISTING_SELECT,
      }),
      db.listing.count({ where }),
    ])

    return {
      hits: hits.map((l) => {
        const ext = l.extendedFields as {
          colorUntil?: string
          urgentUntil?: string
          priceDropUntil?: string
        } | null
        return {
          ...l,
          // DB enum "buy" → UI grammar "sale" (read side of the route's deal mapping).
          dealType: l.dealType === "buy" ? "sale" : l.dealType,
          // ponytail: flatten agent for the client. DB stores as JSON.
          agent: l.agent as unknown,
          colorUntil: ext?.colorUntil,
          urgentUntil: ext?.urgentUntil,
          priceDropUntil: ext?.priceDropUntil,
          tier: effectiveTierKey(l.tier, l.tierExpiresAt),
        }
      }),
      totalHits,
      page,
      pageSize,
      totalPages: Math.ceil(totalHits / pageSize),
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

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

// Anonymous, URL-keyed responses: cache at the edge for 30s. Shields DB/Meili
// from scrapers and repeat keystrokes; new listings appear within a minute.
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" }

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
        return row
          ? [{ ...row, dealType: row.dealType === "buy" ? "sale" : row.dealType, agent: row.agent as unknown }]
          : []
      })
      return Response.json({ ok: true, hits, totalHits: hits.length, page: 1, pageSize: hits.length, totalPages: 1, source: "db" }, { headers: CACHE_HEADERS })
    } catch (e) {
      console.error("[api/search] ids lookup failed:", (e as Error).message)
      return Response.json({ ok: true, hits: [], totalHits: 0, page: 1, pageSize: 0, totalPages: 0, source: "db" }, { headers: CACHE_HEADERS })
    }
  }

  const filters = parseSearchParams(sp)

  // Date-availability filtering needs booking relations that Meili can't
  // express — date-ranged daily searches go straight to Postgres.
  const meiliResult = filters.dailyFrom && filters.dailyTo ? null : await searchListings(filters)
  if (meiliResult) {
    return Response.json({ ok: true, ...meiliResult, source: "meilisearch" }, { headers: CACHE_HEADERS })
  }

  const dbResult = await dbSearch(filters)
  return Response.json({ ok: true, ...dbResult }, { headers: CACHE_HEADERS })
}
