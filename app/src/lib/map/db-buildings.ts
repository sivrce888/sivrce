/**
 * DB-curated map buildings (admin /admin/buildings) → MapBuildingCluster.
 * Merged into the static catalog clusters on /map (mergeDbBuildings): static
 * catalog keeps listings + curated meta on slug collision, DB wins inventory.
 *
 * Also: active listings for map clustering (getMapListings) — buildingSlug from
 * ListingLocation→MapBuilding when attributed.
 *
 * ponytail: one unstable_cache list, tag-revalidated from admin actions.
 * Viewport filter: fetchMapListingIdsInBbox (PostGIS) when map passes bounds.
 */

import { unstable_cache } from "next/cache"

import type { BuildingCatalogEntry } from "@/data/buildings"
import type { DealType, Listing } from "@/data/listings"
import { SERVICE_BRAND } from "@/lib/category-brand"
import { db, dbAvailable } from "@/lib/db"
import { listingIdsInBbox, type Bbox } from "@/lib/geo/postgis"
import { catalogToCluster, type MapBuildingCluster } from "@/lib/map/buildings"
import { activeColorUntil, activePriceDropUntil, activeStoryUntil, activeUrgentUntil, effectiveTierKey, tierKeyToBadge, tierRankOf } from "@/lib/promo-pricing"

export const MAP_BUILDINGS_TAG = "map-buildings"
export const MAP_LISTINGS_TAG = "map-listings"

const USD_GEL = 2.7
/** Ceiling before Meilisearch geo / bbox — enough for Georgia MVP. */
const MAP_LISTINGS_CAP = 2500

function dealToMap(d: string): DealType {
  if (d === "buy") return "sale"
  if (d === "mortgage") return "pledge"
  if (d === "rent") return "rent"
  return "daily"
}

function rowToMapListing(row: {
  id: string
  title: string
  description: string
  dealType: string
  propertyType: string
  price: number
  currency: string
  pricePerSqm: number | null
  rooms: number
  bedrooms: number
  bathrooms: number
  area: number
  floor: number | null
  totalFloors: number | null
  city: string
  district: string
  address: string
  lat: number
  lng: number
  images: string[]
  features: string[]
  views: number
  trustScore: number
  tier: string
  tierExpiresAt: Date | null
  extendedFields: unknown
  agent: unknown
  createdAt: Date
  listingLocation: {
    floorNumber: number | null
    building3D: { mapBuilding: { slug: string } | null } | null
  } | null
}): Listing {
  const usd = row.currency === "USD"
  const priceGEL = usd ? Math.round(row.price * USD_GEL) : row.price
  const perM2GEL = usd
    ? Math.round((row.pricePerSqm ?? 0) * USD_GEL)
    : (row.pricePerSqm ?? 0)
  const agentRaw = (row.agent as { name?: string; phone?: string; agency?: string }) ?? {}
  const buildingSlug = row.listingLocation?.building3D?.mapBuilding?.slug
  const floor = row.listingLocation?.floorNumber ?? row.floor ?? 0
  const tierKey = effectiveTierKey(row.tier, row.tierExpiresAt)
  return {
    id: row.id,
    img: row.images[0] ?? "/images/p1.webp",
    images: row.images,
    priceUSD: Math.round(priceGEL / USD_GEL),
    priceGEL,
    perM2USD: Math.round(perM2GEL / USD_GEL),
    title: row.title,
    address: row.address,
    city: row.city,
    district: row.district,
    dealType: dealToMap(row.dealType),
    propType: (row.propertyType as Listing["propType"]) ?? "apartment",
    rooms: row.rooms,
    beds: row.bedrooms,
    baths: row.bathrooms,
    area: row.area,
    floor,
    totalFloors: row.totalFloors ?? 0,
    views: row.views,
    badge: tierKeyToBadge(tierKey),
    highlighted: Boolean(
      activeColorUntil(row.extendedFields as { colorUntil?: string } | null),
    ),
    stickerUrgent: Boolean(
      activeUrgentUntil(row.extendedFields as { urgentUntil?: string } | null),
    ),
    stickerPriceDrop: Boolean(
      activePriceDropUntil(row.extendedFields as { priceDropUntil?: string } | null),
    ),
    inStory: Boolean(
      activeStoryUntil(row.extendedFields as { storyUntil?: string } | null),
    ),
    ai: { score: row.trustScore, label: "" },
    features: row.features,
    description: row.description,
    coords: { lat: row.lat, lng: row.lng },
    buildingSlug,
    postedAt: row.createdAt.toISOString().slice(0, 10),
    agent: {
      name: agentRaw.name ?? "სივრცე",
      phone: agentRaw.phone ?? "",
      agency: agentRaw.agency ?? "",
    },
    isNew: Date.now() - row.createdAt.getTime() < 7 * 86400000,
  }
}

async function fetchMapListings(): Promise<Listing[]> {
  try {
    if (!(await dbAvailable())) return []
    const rows = await db.listing.findMany({
      where: { deletedAt: null, status: "active" },
      select: {
        id: true,
        title: true,
        description: true,
        dealType: true,
        propertyType: true,
        price: true,
        currency: true,
        pricePerSqm: true,
        rooms: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
        floor: true,
        totalFloors: true,
        city: true,
        district: true,
        address: true,
        lat: true,
        lng: true,
        images: true,
        features: true,
        views: true,
        trustScore: true,
        tier: true,
        tierExpiresAt: true,
        extendedFields: true,
        agent: true,
        createdAt: true,
        listingLocation: {
          select: {
            floorNumber: true,
            building3D: { select: { mapBuilding: { select: { slug: true } } } },
          },
        },
      },
      // Cap then rank in JS — Prisma can't order by custom tier weight.
      orderBy: { createdAt: "desc" },
      take: MAP_LISTINGS_CAP,
    })
    return rows
      .map((row) => ({
        listing: rowToMapListing(row),
        rank: tierRankOf(row.tier, row.tierExpiresAt),
      }))
      .sort((a, b) => b.rank - a.rank || b.listing.postedAt.localeCompare(a.listing.postedAt))
      .map((x) => x.listing)
  } catch {
    return []
  }
}

/** PostGIS bbox → listing ids (for map viewport when > MAP_LISTINGS_CAP). */
export async function fetchMapListingIdsInBbox(bbox: Bbox): Promise<string[]> {
  try {
    return await listingIdsInBbox(bbox, MAP_LISTINGS_CAP)
  } catch {
    return []
  }
}

/** Active listings for /map clustering. Empty → Map3D keeps static LISTINGS. */
export const getMapListings = unstable_cache(
  fetchMapListings,
  ["db-map-listings"],
  { tags: [MAP_LISTINGS_TAG], revalidate: 60 },
)

/** Uncached snapshot for map refresh button — bypasses unstable_cache. */
export async function loadMapDataFresh(): Promise<{
  listings: Listing[]
  buildings: MapBuildingCluster[]
}> {
  const [listings, rows] = await Promise.all([fetchMapListings(), fetchRows()])
  return { listings, buildings: rows.map(rowToCluster) }
}

const SELECT = {
  slug: true,
  code: true,
  title: true,
  titleEn: true,
  description: true,
  address: true,
  city: true,
  district: true,
  buildingNumber: true,
  polygonCoords: true,
  lat: true,
  lng: true,
  floors: true,
  yearBuilt: true,
  img: true,
  status: true,
  projectSlug: true,
  developer: { select: { slug: true, name: true } },
  building3D: {
    select: {
      floors: {
        select: {
          floorNumber: true,
          availableUnits: true,
          forSaleCount: true,
          forRentCount: true,
          forDailyCount: true,
          forPledgeCount: true,
          pricePerSqmMin: true,
        },
        orderBy: { floorNumber: "asc" as const },
      },
    },
  },
} as const

export type DbBuildingRow = {
  slug: string
  code: string | null
  title: string
  titleEn: string | null
  description: string | null
  address: string | null
  city: string | null
  district: string | null
  buildingNumber: string | null
  polygonCoords: unknown
  lat: number
  lng: number
  floors: number
  yearBuilt: number | null
  img: string | null
  status: string
  projectSlug: string | null
  developer: { slug: string; name: string } | null
  building3D: {
    floors: Array<{
      floorNumber: number
      availableUnits: number
      forSaleCount: number
      forRentCount: number
      forDailyCount: number
      forPledgeCount: number
      pricePerSqmMin: number | null
    }>
  } | null
}

/** DB row → catalog entry shape, so every existing map/SEO consumer works unchanged. */
export function rowToCatalogEntry(row: DbBuildingRow): BuildingCatalogEntry {
  return {
    slug: row.slug,
    code: row.code ?? "",
    name: row.title,
    nameEn: row.titleEn ?? row.title,
    address: row.address ?? "",
    city: row.city ?? "",
    district: row.district ?? "",
    coords: { lat: row.lat, lng: row.lng },
    buildingNumber: row.buildingNumber ?? "",
    img: row.img ?? "/images/np1.webp",
    developerSlug: row.developer?.slug ?? "",
    yearBuilt: row.yearBuilt ?? undefined,
    floors: row.floors,
    rating: 0,
    description: { ka: row.description ?? "", en: row.description ?? "", ru: "" },
    projectSlug: row.projectSlug ?? undefined,
    status: row.status === "construction" ? "construction" : "ready",
  }
}

export function rowToCluster(row: DbBuildingRow): MapBuildingCluster {
  const c = catalogToCluster(rowToCatalogEntry(row), [])
  c.developerName = row.developer?.name
  c.progress = row.status === "construction" ? 55 : 100
  if (row.status === "completed") {
    c.status = "completed"
    c.color = SERVICE_BRAND.developers.hue
  }
  const ring = (row.polygonCoords as { ring?: [number, number][] } | null)?.ring
  if (Array.isArray(ring) && ring.length >= 5) c.ring = ring
  const inv = row.building3D?.floors
  if (inv?.length) {
    c.inventory = inv.map((f) => ({
      n: f.floorNumber,
      available: f.availableUnits,
      sale: f.forSaleCount,
      rent: f.forRentCount,
      daily: f.forDailyCount,
      pledge: f.forPledgeCount,
      minPricePerSqm: f.pricePerSqmMin,
    }))
  }
  return c
}

async function fetchRows(): Promise<DbBuildingRow[]> {
  try {
    if (!(await dbAvailable())) return []
    return (await db.mapBuilding.findMany({
      where: { status: { not: "hidden" } },
      select: SELECT,
      orderBy: [{ popular: "desc" }, { createdAt: "desc" }],
    })) as unknown as DbBuildingRow[]
  } catch {
    // Map must render even when the DB is unreachable — static catalog still shows.
    return []
  }
}

/** All visible DB buildings as map clusters (cached; admin actions revalidate the tag). */
export const getDbBuildingClusters = unstable_cache(
  async (): Promise<MapBuildingCluster[]> => (await fetchRows()).map(rowToCluster),
  ["db-building-clusters"],
  { tags: [MAP_BUILDINGS_TAG] },
)

/** All visible DB buildings as catalog entries (for /buildings/[slug] fallback). */
export const getDbBuildingEntries = unstable_cache(
  async (): Promise<Array<{ entry: BuildingCatalogEntry; developer: { slug: string; name: string } | null }>> =>
    (await fetchRows()).map((row) => ({ entry: rowToCatalogEntry(row), developer: row.developer })),
  ["db-building-entries"],
  { tags: [MAP_BUILDINGS_TAG] },
)
