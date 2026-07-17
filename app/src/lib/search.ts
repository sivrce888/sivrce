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
  dealType?: "sale" | "rent" | "daily"
  propertyType?: "apartment" | "house" | "commercial" | "land"
  city?: string
  district?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  rooms?: number
  sort?: "date" | "price-asc" | "price-desc" | "area"
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
  createdAt: string
  status: string
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
      "area",
      "rooms",
      "bedrooms",
      "bathrooms",
      "status",
    ])

    // Sortable attributes.
    await index.updateSortableAttributes(["price", "area", "rooms", "createdAt"])

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

    // Ranking rules: keyword match first, then freshness, then price
    await index.updateRankingRules([
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
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
  if (filters.district) parts.push(`district = ${esc(filters.district)}`)
  if (filters.minPrice !== undefined) parts.push(`price >= ${filters.minPrice}`)
  if (filters.maxPrice !== undefined) parts.push(`price <= ${filters.maxPrice}`)
  if (filters.minArea !== undefined) parts.push(`area >= ${filters.minArea}`)
  if (filters.maxArea !== undefined) parts.push(`area <= ${filters.maxArea}`)
  if (filters.rooms !== undefined) parts.push(`rooms >= ${filters.rooms}`)

  return parts.join(" AND ")
}

function buildMeiliSort(filters: SearchFilters): string[] | undefined {
  switch (filters.sort) {
    case "price-asc":
      return ["price:asc"]
    case "price-desc":
      return ["price:desc"]
    case "area":
      return ["area:desc"]
    case "date":
    default:
      // Default: newest first
      return ["createdAt:desc"]
  }
}

export async function searchListings(filters: SearchFilters): Promise<SearchResults | null> {
  const client = await lazyInit()
  if (!client) return null

  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 24))

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

    return {
      hits: raw.hits,
      totalHits,
      page,
      pageSize,
      totalPages: Math.ceil(totalHits / pageSize),
      facets: raw.facetDistribution,
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
