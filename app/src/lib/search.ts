/**
 * Thin adapter over Meilisearch for full-text + geo + facet search.
 * All functions degrade gracefully: if MEILISEARCH_HOST / MEILISEARCH_API_KEY
 * are missing, calls return empty/null/fallback — never throw.
 *
 * Georgian-language settings: Meilisearch is configured with Georgian-specific
 * typo tolerance, searchable attributes in ka, and proper ranking rules.
 *
 * ponytail: single index "listings", no sharding, no replica setup.
 * Upgrade path: multi-index per language, synonyms dictionary, geo-facets.
 */

import { Meilisearch, type SearchParams } from "meilisearch"
import { USD_GEL } from "@/data/listings"
import { districtSearchValues } from "@/lib/district-canon"
import { METRO_NEAR_M } from "@/lib/map/pois"

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _client: Meilisearch | null | undefined

function hasMeilisearch(): boolean {
  return Boolean(process.env.MEILISEARCH_HOST)
}

function getClient(): Meilisearch | null {
  if (!hasMeilisearch()) return null
  if (_client !== undefined) return _client

  const host = process.env.MEILISEARCH_HOST!
  const apiKey = process.env.MEILISEARCH_API_KEY ?? ""

  try {
    _client = new Meilisearch({ host, apiKey })
  } catch (e) {
    console.error("[search] Failed to create Meilisearch client:", (e as Error).message)
    _client = null
  }
  return _client
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchFilters {
  /** Free-text search query */
  q?: string
  /** DB dialect (ListingDealType). The route maps UI "sale" → "buy" at the boundary. */
  dealType?: "buy" | "rent" | "daily" | "mortgage"
  propertyType?: "apartment" | "house" | "commercial" | "land"
  city?: string
  district?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  rooms?: number
  bedrooms?: number
  bathrooms?: number
  floorMin?: number
  floorMax?: number
  /** Stored vocabulary keys (see src/lib/features.ts) */
  conditions?: string[]
  buildingStatuses?: string[]
  projects?: string[]
  floorTypes?: string[]
  features?: string[]
  hasPhoto?: boolean
  verifiedOnly?: boolean
  petsOnly?: boolean
  sellerType?: "owner" | "agency"
  /** Within METRO_NEAR_M of a Tbilisi metro station (indexed as metroM). */
  nearMetro?: boolean
  /** Daily-rent availability window (YYYY-MM-DD). DB-only — Meili can't express
   * booking overlap, so the route skips Meili when these are set. */
  dailyFrom?: string
  dailyTo?: string
  /** Map viewport (WGS84). DB/PostGIS only — Meili skipped when set. */
  bbox?: { west: number; south: number; east: number; north: number }
  /** Pre-resolved id set from PostGIS bbox (set by /api/search). */
  idsIn?: string[]
  /** Price-filter currency; bounds are converted via USD_GEL. Default USD. */
  currency?: "USD" | "GEL"
  sort?: "date" | "price-asc" | "price-desc" | "area" | "ai" | "m2asc" | "m2desc"
  page?: number
  pageSize?: number
}

export interface SearchResultItem {
  id: string
  title: string
  city: string
  district: string
  dealType: string
  propertyType: string
  price: number
  area: number
  rooms: number
  images: string[]
  [key: string]: unknown
}

export interface SearchResults {
  hits: SearchResultItem[]
  totalHits: number
  page: number
  pageSize: number
  totalPages: number
  facets?: Record<string, Record<string, number>>
}

export interface ListingDocument {
  id: string
  title: string
  description: string
  city: string
  district: string
  address: string
  dealType: string
  propertyType: string
  price: number
  currency: string
  /** price normalized to USD via USD_GEL — cross-currency price filtering/sorting */
  priceUSD: number
  pricePerSqm?: number
  verified: boolean
  hasImages: boolean
  petsAllowed?: boolean
  sellerType?: string
  /** Vocabulary keys from src/lib/features.ts (from extendedFields) */
  condition?: string
  buildingStatus?: string
  project?: string
  floorType?: string
  area: number
  rooms: number
  bedrooms: number
  bathrooms: number
  floor?: number
  totalFloors?: number
  features: string[]
  images: string[]
  lat: number
  lng: number
  /** Meters to nearest Tbilisi metro; 999999 when far / outside catchment. */
  metroM: number
  /** Developer directory promo rows — excluded from unit /search by default. */
  projectCatalog?: boolean
  /** pricePerSqm normalized to USD (cross-currency m² sort). */
  pricePerSqmUSD?: number
  createdAt: string
  status: string
  /** ISO — paid color highlight expiry; omit when inactive */
  colorUntil?: string
  /** ISO — paid „სასწრაფოდ“ sticker expiry */
  urgentUntil?: string
  /** ISO — paid „ფასი დაწეულია“ sticker expiry */
  priceDropUntil?: string
  /** ISO — paid Stories rail expiry */
  storyUntil?: string
  trustScore?: number
  /** DB ListingTier key; expired paid → "standard" at index time */
  tier: string
  /** 0 standard · 1 vip · 2 super_vip · 3 diamond — drives default sort */
  tierRank: number
}

const INDEX_NAME = "listings"

// ---------------------------------------------------------------------------
// Index configuration (Georgian-language tuned)
// ---------------------------------------------------------------------------

/**
 * Ensure the Meilisearch index exists with Georgian-optimized settings.
 * Called lazily on first search/index operation.
 */
async function ensureIndex(): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  try {
    const index = client.index(INDEX_NAME)

    // Searchable attributes — title and description in Georgian are primary,
    // followed by location fields for discoverability.
    await index.updateSearchableAttributes([
      "title",
      "description",
      "city",
      "district",
      "address",
      "features",
    ])

    // Filterable attributes — all facets the UI can filter by.
    await index.updateFilterableAttributes([
      "dealType",
      "propertyType",
      "city",
      "district",
      "price",
      "priceUSD",
      "area",
      "rooms",
      "bedrooms",
      "bathrooms",
      "floor",
      "status",
      "features",
      "condition",
      "buildingStatus",
      "project",
      "floorType",
      "verified",
      "hasImages",
      "petsAllowed",
      "sellerType",
      "metroM",
      "projectCatalog",
    ])

    // Sortable attributes.
    await index.updateSortableAttributes([
      "price",
      "priceUSD",
      "pricePerSqm",
      "pricePerSqmUSD",
      "projectCatalog",
      "area",
      "rooms",
      "createdAt",
      "trustScore",
      "tierRank",
    ])

    // Typo tolerance: Georgian script has no case, uses unique characters.
    // We disable typo on short words and limit to 1 typo for medium words.
    await index.updateTypoTolerance({
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 4, // Georgian words tend to be longer; avoid false corrections on short ones
        twoTypos: 8,
      },
      disableOnWords: [], // no global stop list
      disableOnAttributes: [], // typo tolerance on all searchable fields
    })

    // Relevance first; paid tier only as tie-break when no explicit sort.
    // Default API sort is tierRank+createdAt (see buildMeiliSort).
    // ponytail: no SUPER VIP page-1 slot cap yet — add when paid share >40% of page 1.
    await index.updateRankingRules([
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
      "tierRank:desc",
      "createdAt:desc",
    ])

    return true
  } catch (e) {
    console.error("[search] ensureIndex failed:", (e as Error).message)
    return false
  }
}

let _indexReady = false

async function lazyInit(): Promise<Meilisearch | null> {
  const client = getClient()
  if (!client) return null
  if (!_indexReady) {
    _indexReady = await ensureIndex()
  }
  return _indexReady ? client : null
}

// ---------------------------------------------------------------------------
// searchListings
// ---------------------------------------------------------------------------

function buildMeiliFilter(filters: SearchFilters): string {
  const parts: string[] = []

  // ponytail: string escaping — Georgian characters are safe; only : and " need escaping.
  // Meilisearch filter expressions: attribute OP value, combined with AND.
  const esc = (v: string) => `"${v.replace(/"/g, '\\"')}"`

  if (filters.dealType) parts.push(`dealType = ${esc(filters.dealType)}`)
  if (filters.propertyType) parts.push(`propertyType = ${esc(filters.propertyType)}`)
  if (filters.city) parts.push(`city = ${esc(filters.city)}`)
  if (filters.district) {
    const vals = districtSearchValues(filters.district, filters.city)
    parts.push(
      vals.length === 1
        ? `district = ${esc(vals[0]!)}`
        : `district IN [${vals.map(esc).join(", ")}]`,
    )
  }
  // Price bounds arrive in filters.currency (default USD) — filter the
  // normalized priceUSD so GEL and USD listings compare fairly.
  const toUSD = (v: number) => (filters.currency === "GEL" ? v / USD_GEL : v)
  if (filters.minPrice !== undefined) parts.push(`priceUSD >= ${Math.floor(toUSD(filters.minPrice))}`)
  if (filters.maxPrice !== undefined) parts.push(`priceUSD <= ${Math.ceil(toUSD(filters.maxPrice))}`)
  if (filters.minArea !== undefined) parts.push(`area >= ${filters.minArea}`)
  if (filters.maxArea !== undefined) parts.push(`area <= ${filters.maxArea}`)
  if (filters.rooms !== undefined) parts.push(`rooms >= ${filters.rooms}`)
  if (filters.bedrooms !== undefined) parts.push(`bedrooms >= ${filters.bedrooms}`)
  if (filters.bathrooms !== undefined) parts.push(`bathrooms >= ${filters.bathrooms}`)
  if (filters.floorMin !== undefined) parts.push(`floor >= ${filters.floorMin}`)
  if (filters.floorMax !== undefined) parts.push(`floor <= ${filters.floorMax}`)
  if (filters.conditions?.length) parts.push(`condition IN [${filters.conditions.map(esc).join(", ")}]`)
  if (filters.buildingStatuses?.length) parts.push(`buildingStatus IN [${filters.buildingStatuses.map(esc).join(", ")}]`)
  if (filters.projects?.length) parts.push(`project IN [${filters.projects.map(esc).join(", ")}]`)
  if (filters.floorTypes?.length) parts.push(`floorType IN [${filters.floorTypes.map(esc).join(", ")}]`)
  // AND semantics: every selected feature must be present.
  for (const f of filters.features ?? []) parts.push(`features = ${esc(f)}`)
  if (filters.hasPhoto) parts.push("hasImages = true")
  if (filters.verifiedOnly) parts.push("verified = true")
  if (filters.petsOnly) parts.push("petsAllowed = true")
  if (filters.sellerType) parts.push(`sellerType = ${esc(filters.sellerType)}`)
  if (filters.nearMetro) parts.push(`metroM <= ${METRO_NEAR_M}`)
  // Catalog cards live on /projects — keep /sale|/rent|/daily unit-only.
  parts.push("projectCatalog = false")

  return parts.join(" AND ")
}

function buildMeiliSort(filters: SearchFilters): string[] | undefined {
  switch (filters.sort) {
    case "price-asc":
      return ["priceUSD:asc"]
    case "price-desc":
      return ["priceUSD:desc"]
    case "area":
      return ["area:desc"]
    case "ai":
      return ["trustScore:desc"]
    case "m2asc":
      return ["pricePerSqmUSD:asc"]
    case "m2desc":
      return ["pricePerSqmUSD:desc"]
    case "date":
    default:
      return ["tierRank:desc", "createdAt:desc"]
  }
}

export async function searchListings(filters: SearchFilters): Promise<SearchResults | null> {
  const client = await lazyInit()
  if (!client) return null

  const page = Math.max(1, filters.page ?? 1)
  // Cap 100: the /search map view pulls the first 100 matches for pins.
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 24))

  try {
    const index = client.index(INDEX_NAME)

    const params: SearchParams = {
      q: filters.q ?? "",
      filter: buildMeiliFilter(filters),
      sort: buildMeiliSort(filters),
      page,
      hitsPerPage: pageSize,
      facets: ["dealType", "propertyType", "city", "district", "rooms"],
    }

    // ponytail: Meilisearch conditional types (FinitePagination vs InfinitePagination)
    // can be hard for TS to narrow. The runtime always populates totalHits when
    // page+hitsPerPage are set.
    const result = await index.search<SearchResultItem>(params.q, params)
    const raw = result as unknown as {
      hits: SearchResultItem[]
      totalHits?: number
      estimatedTotalHits?: number
      facetDistribution?: Record<string, Record<string, number>>
    }
    const totalHits = raw.totalHits ?? raw.estimatedTotalHits ?? 0

    // Read-path grammar: the index stores "buy"/"mortgage", the UI speaks
    // "sale"/"pledge". Map hits and facet keys so clients never see the DB dialect.
    const uiDeal = (d: string) => (d === "buy" ? "sale" : d === "mortgage" ? "pledge" : d)
    const facets = raw.facetDistribution
    if (facets?.dealType) {
      facets.dealType = Object.fromEntries(
        Object.entries(facets.dealType).map(([k, v]) => [uiDeal(k), v]),
      )
    }

    return {
      hits: raw.hits.map((h) => ({
        ...h,
        dealType: uiDeal(h.dealType),
      })),
      totalHits,
      page,
      pageSize,
      totalPages: Math.ceil(totalHits / pageSize),
      facets,
    }
  } catch (e) {
    console.error("[search] searchListings failed:", (e as Error).message)
    return null
  }
}

// ---------------------------------------------------------------------------
// indexListing
// ---------------------------------------------------------------------------

export async function indexListing(listing: ListingDocument): Promise<boolean> {
  const client = await lazyInit()
  if (!client) return false

  try {
    await client.index(INDEX_NAME).addDocuments([listing], { primaryKey: "id" })
    return true
  } catch (e) {
    console.error("[search] indexListing failed:", (e as Error).message)
    return false
  }
}

// ---------------------------------------------------------------------------
// deleteListing
// ---------------------------------------------------------------------------

export async function deleteListing(id: string): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  try {
    await client.index(INDEX_NAME).deleteDocument(id)
    return true
  } catch (e) {
    console.error("[search] deleteListing failed:", (e as Error).message)
    return false
  }
}

// ---------------------------------------------------------------------------
// syncAllListings
// ---------------------------------------------------------------------------

export async function syncAllListings(listings: ListingDocument[] = []): Promise<{
  ok: boolean
  indexed: number
  error?: string
}> {
  _indexReady = false // re-apply ranking rules (tierRank) on full sync
  const client = await lazyInit()
  if (!client) {
    return { ok: false, indexed: 0, error: "meilisearch_unavailable" }
  }

  try {
    const index = client.index(INDEX_NAME)

    // ponytail: delete-then-replace — fine for <100k listings.
    // Upgrade path: use updateDocuments with upsert + diff-based sync.
    await index.deleteAllDocuments()
    // Meilisearch batches automatically; for large sets, chunk at 10k.
    const chunkSize = 10000
    let indexed = 0
    for (let i = 0; i < listings.length; i += chunkSize) {
      const chunk = listings.slice(i, i + chunkSize)
      await index.addDocuments(chunk, { primaryKey: "id" })
      indexed += chunk.length
    }
    return { ok: true, indexed }
  } catch (e) {
    console.error("[search] syncAllListings failed:", (e as Error).message)
    return { ok: false, indexed: 0, error: (e as Error).message }
  }
}
