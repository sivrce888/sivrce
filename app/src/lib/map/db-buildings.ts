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
import type { DealType, Listing, MapListing } from "@/data/listings"
import { SERVICE_BRAND } from "@/lib/category-brand"
import { streetHrefForListing } from "@/lib/street-href"
import { db, dbAvailable } from "@/lib/db"
import { listingIdsInBbox, type Bbox } from "@/lib/geo/postgis"
import { catalogToCluster, type MapBuildingCluster } from "@/lib/map/buildings"
import {
  aggregateBuildingDealCounts,
} from "@/lib/map/building-inventory"
import { closeRing, parseFootprintRing } from "@/lib/map/pick-building"
import { activeColorUntil, activePriceDropUntil, activeStoryUntil, activeUrgentUntil, effectiveTierKey, tierKeyToBadge, tierRankOf } from "@/lib/promo-pricing"
import { requestCountryLock } from "@/lib/request-market"

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

export type { MapListing }

export function rowToMapListing(row: {
  id: string
  publicId: number | null
  country: string
  title: string
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
  tier: string
  tierExpiresAt: Date | null
  extendedFields: unknown
  createdAt: Date
  listingLocation: {
    floorNumber: number | null
    building3D: { mapBuilding: { slug: string } | null } | null
  } | null
}): MapListing {
  const usd = row.currency === "USD"
  const priceGEL = usd ? Math.round(row.price * USD_GEL) : row.price
  const perM2GEL = usd
    ? Math.round((row.pricePerSqm ?? 0) * USD_GEL)
    : (row.pricePerSqm ?? 0)
  const buildingSlug = row.listingLocation?.building3D?.mapBuilding?.slug
  const floor = row.listingLocation?.floorNumber ?? row.floor ?? 0
  const tierKey = effectiveTierKey(row.tier, row.tierExpiresAt)
  return {
    id: row.id,
    ...(row.publicId ? { publicId: row.publicId } : {}),
    country: row.country,
    streetHref: streetHrefForListing(row.address, row.district, row.city),
    img: row.images[0] ?? "/images/p1.webp",
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
    isExclusive: (row.extendedFields as { exclusive?: boolean } | null)?.exclusive === true,
    isSivrceExclusive: (row.extendedFields as { sivrceExclusive?: boolean } | null)?.sivrceExclusive === true,
    coords: { lat: row.lat, lng: row.lng },
    buildingSlug,
    postedAt: row.createdAt.toISOString().slice(0, 10),
    isNew: Date.now() - row.createdAt.getTime() < 7 * 86400000,
  }
}

async function fetchMapListings(country?: string): Promise<MapListing[]> {
  try {
    if (!(await dbAvailable())) return []
    return await queryMapListings(country)
  } catch {
    return []
  }
}

/** Throws on DB failure — callers that must tell "down" from "empty" use this. */
async function queryMapListings(country?: string): Promise<MapListing[]> {
  const rows = await db.listing.findMany({
    // Cap is for mappable pins — drop 0,0 unset sentinel.
    where: {
      deletedAt: null,
      status: "active",
      NOT: { AND: [{ lat: 0 }, { lng: 0 }] },
      ...(country ? { country } : {}),
    },
    select: {
      id: true,
      publicId: true,
      country: true,
      title: true,
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
      tier: true,
      tierExpiresAt: true,
      extendedFields: true,
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
}

/** PostGIS bbox → listing ids (for map viewport when > MAP_LISTINGS_CAP). */
export async function fetchMapListingIdsInBbox(bbox: Bbox): Promise<string[]> {
  try {
    return await listingIdsInBbox(bbox, MAP_LISTINGS_CAP)
  } catch {
    return []
  }
}

const getMapListingsCached = unstable_cache(
  fetchMapListings,
  ["db-map-listings"],
  { tags: [MAP_LISTINGS_TAG], revalidate: 60 },
)

/** Active listings for /map. Empty cache is treated as miss — never pin a blank map for 60s. */
export async function getMapListings(): Promise<MapListing[]> {
  const cached = await getMapListingsCached()
  if (cached.length > 0) return cached
  return fetchMapListings()
}

/** Uncached snapshot for map refresh button — bypasses unstable_cache. `country` unset = worldwide. */
export async function loadMapDataFresh(country?: string): Promise<{
  listings: MapListing[]
  buildings: MapBuildingCluster[]
}> {
  // Throws when the DB is down. A 200 with empty arrays here was CDN-cached and
  // read by the map as "this country has 0 listings" — pins vanished, counter lied.
  if (!(await dbAvailable())) throw new Error('db unavailable')
  const [listings, rows] = await Promise.all([queryMapListings(country), queryRows()])
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
  const ring = parseFootprintRing(row.polygonCoords)
  // mergeDbBuildings drops this when FOOTPRINTS has official TAS/OSM massing.
  if (ring && ring.length >= 4) c.ring = closeRing(ring)
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

/** Throws on DB trouble so unstable_cache never stores an outage as "no buildings". */
async function queryRows(): Promise<DbBuildingRow[]> {
  if (!(await dbAvailable())) throw new Error("db unavailable")
  return (await db.mapBuilding.findMany({
    where: { status: { not: "hidden" } },
    select: SELECT,
    orderBy: [{ popular: "desc" }, { createdAt: "desc" }],
  })) as unknown as DbBuildingRow[]
}

// No revalidate on these (admin actions bust the tag), so a cached empty result
// from one DB blip used to 404 every DB building page until the next admin edit.
const dbBuildingClusters = unstable_cache(
  async (): Promise<MapBuildingCluster[]> => (await queryRows()).map(rowToCluster),
  ["db-building-clusters-v2"],
  { tags: [MAP_BUILDINGS_TAG] },
)
const dbBuildingEntries = unstable_cache(
  async (): Promise<Array<{ entry: BuildingCatalogEntry; developer: { slug: string; name: string } | null }>> =>
    (await queryRows()).map((row) => ({ entry: rowToCatalogEntry(row), developer: row.developer })),
  ["db-building-entries-v2"],
  { tags: [MAP_BUILDINGS_TAG] },
)

/** All visible DB buildings as map clusters (cached; admin actions revalidate the tag). */
export async function getDbBuildingClusters(): Promise<MapBuildingCluster[]> {
  return dbBuildingClusters().catch(() => [])
}

/** All visible DB buildings as catalog entries (for /buildings/[slug] fallback). */
export async function getDbBuildingEntries() {
  return dbBuildingEntries().catch(() => [])
}

export { aggregateBuildingDealCounts } from "@/lib/map/building-inventory"

/**
 * Live deal counts keyed by MapBuilding slug (from attributed listings).
 * ponytail: reuse getMapListings cache; dedicated groupBy if MAP_LISTINGS_CAP bites.
 */
export async function getBuildingDealCountsBySlug(): Promise<
  Record<string, Record<DealType, number>>
> {
  return aggregateBuildingDealCounts(await getMapListings())
}

/** Active attributed listings for one building slug. */
export async function getListingsForBuildingSlug(slug: string): Promise<MapListing[]> {
  const lock = await requestCountryLock()
  const all = await getMapListings()
  // getMapListings is one worldwide host-shared cache — clamp after, never inside it.
  return all.filter((l) => l.buildingSlug === slug && (!lock || l.country === lock))
}
