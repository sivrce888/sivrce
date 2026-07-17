import { searchListings, type SearchFilters } from "@/lib/search"
import { db } from "@/lib/db"
import { Prisma } from "@/generated/prisma/client"

// ---------------------------------------------------------------------------
// DB fallback query builder
// ---------------------------------------------------------------------------

function buildDbWhere(filters: SearchFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {
    deletedAt: null,
    status: "active",
  }

  if (filters.dealType) where.dealType = filters.dealType as Prisma.ListingWhereInput["dealType"]
  if (filters.propertyType) where.propertyType = filters.propertyType as Prisma.ListingWhereInput["propertyType"]
  if (filters.city) where.city = filters.city
  if (filters.district) where.district = filters.district
  if (filters.minPrice !== undefined) where.price = { ...(where.price as object ?? {}), gte: filters.minPrice }
  if (filters.maxPrice !== undefined) where.price = { ...(where.price as object ?? {}), lte: filters.maxPrice }
  if (filters.minArea !== undefined) where.area = { ...(where.area as object ?? {}), gte: filters.minArea }
  if (filters.maxArea !== undefined) where.area = { ...(where.area as object ?? {}), lte: filters.maxArea }
  if (filters.rooms !== undefined) where.rooms = { ...(where.rooms as object ?? {}), gte: filters.rooms }

  // Free-text search: simple ILIKE on title + description (Postgres).
  // ponytail: no tsvector for DB fallback — fine for MVP. Upgrade: enable pg_trgm.
  if (filters.q) {
    where.AND = [
      {
        OR: [
          { title: { contains: filters.q, mode: "insensitive" } },
          { description: { contains: filters.q, mode: "insensitive" } },
          { city: { contains: filters.q, mode: "insensitive" } },
          { district: { contains: filters.q, mode: "insensitive" } },
          { address: { contains: filters.q, mode: "insensitive" } },
        ],
      },
    ]
  }

  return where
}

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
  trustScore: true,
  createdAt: true,
  agent: true,
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
      hits: hits.map((l) => ({
        ...l,
        // DB enum "buy" → UI grammar "sale" (read side of the route's deal mapping).
        dealType: l.dealType === "buy" ? "sale" : l.dealType,
        // ponytail: flatten agent for the client. DB stores as JSON.
        agent: l.agent as unknown,
      })),
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

  // Trust-boundary sanitize: Number('undefined'/'abc') is NaN, which Prisma
  // rejects as a missing argument. Non-finite numbers become undefined.
  const num = (key: string) => {
    const raw = sp.get(key)
    if (!raw) return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  // UI speaks "sale", DB speaks "buy" (DEALS map in /api/listings). Normalize
  // once at the trust boundary — meili and DB filters both consume this.
  const dealParam = sp.get("dealType")
  const dealType = dealParam === "sale" ? "buy" : dealParam

  // Free-text / location strings are capped at the trust boundary — a 10MB q
  // would otherwise flow into Meili, ILIKE and Meili filter strings.
  const str = (key: string) => sp.get(key)?.slice(0, 120) || undefined

  const filters: SearchFilters = {
    q: str("q"),
    dealType: (dealType as SearchFilters["dealType"]) ?? undefined,
    propertyType: (sp.get("propertyType") as SearchFilters["propertyType"]) ?? undefined,
    city: str("city"),
    district: str("district"),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minArea: num("minArea"),
    maxArea: num("maxArea"),
    rooms: num("rooms"),
    sort: (sp.get("sort") as SearchFilters["sort"]) ?? "date",
    page: num("page") ?? 1,
    pageSize: num("pageSize") ?? 24,
  }

  // Try Meilisearch first, fall back to DB.
  const meiliResult = await searchListings(filters)
  if (meiliResult) {
    return Response.json({ ok: true, ...meiliResult, source: "meilisearch" }, { headers: CACHE_HEADERS })
  }

  const dbResult = await dbSearch(filters)
  return Response.json({ ok: true, ...dbResult }, { headers: CACHE_HEADERS })
}
