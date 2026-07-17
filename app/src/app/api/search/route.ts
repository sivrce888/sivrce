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

  if (filters.dealType) where.dealType = filters.dealType as any
  if (filters.propertyType) where.propertyType = filters.propertyType as any
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
    case "date":
    default:
      return { createdAt: "desc" }
  }
}

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
        select: {
          id: true,
          title: true,
          city: true,
          district: true,
          dealType: true,
          propertyType: true,
          price: true,
          currency: true,
          area: true,
          rooms: true,
          images: true,
          slug: true,
          createdAt: true,
          agent: true,
        },
      }),
      db.listing.count({ where }),
    ])

    return {
      hits: hits.map((l) => ({
        ...l,
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

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sp = url.searchParams

  const filters: SearchFilters = {
    q: sp.get("q") ?? undefined,
    dealType: (sp.get("dealType") as SearchFilters["dealType"]) ?? undefined,
    propertyType: (sp.get("propertyType") as SearchFilters["propertyType"]) ?? undefined,
    city: sp.get("city") ?? undefined,
    district: sp.get("district") ?? undefined,
    minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
    maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
    minArea: sp.get("minArea") ? Number(sp.get("minArea")) : undefined,
    maxArea: sp.get("maxArea") ? Number(sp.get("maxArea")) : undefined,
    rooms: sp.get("rooms") ? Number(sp.get("rooms")) : undefined,
    sort: (sp.get("sort") as SearchFilters["sort"]) ?? "date",
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : 24,
  }

  // Try Meilisearch first, fall back to DB.
  const meiliResult = await searchListings(filters)
  if (meiliResult) {
    return Response.json({ ok: true, ...meiliResult, source: "meilisearch" })
  }

  const dbResult = await dbSearch(filters)
  return Response.json({ ok: true, ...dbResult })
}
