/**
 * DB-curated map buildings (admin /admin/buildings) → MapBuildingCluster.
 * Merged into the static catalog clusters by the /map page. Static catalog
 * wins on slug collision (it carries listings + curated meta).
 *
 * ponytail: one unstable_cache list, tag-revalidated from admin actions.
 * Upgrade → PostGIS ST_DWithin bbox queries when building count × viewport matters.
 */

import { unstable_cache } from "next/cache"

import { SERVICE_BRAND } from "@/lib/category-brand"
import { db } from "@/lib/db"
import { catalogToCluster, type MapBuildingCluster } from "@/lib/map/buildings"
import type { BuildingCatalogEntry } from "@/data/buildings"

export const MAP_BUILDINGS_TAG = "map-buildings"

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
  return c
}

async function fetchRows(): Promise<DbBuildingRow[]> {
  try {
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
