/**
 * PostGIS helpers — geography lives outside Prisma's type system.
 * Trigger syncs listings.location from lat/lng; these are for queries + checks.
 */

import { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"

/** Force-sync one listing's geography (backfill / repair). Trigger covers normal writes. */
export async function syncListingLocation(listingId: string): Promise<void> {
  await db.$executeRaw`
    UPDATE listings
    SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    WHERE id = ${listingId}
      AND lat IS NOT NULL AND lng IS NOT NULL
      AND lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180
  `
}

export type Bbox = { west: number; south: number; east: number; north: number }

/** Active listing ids whose point falls in a WGS84 bbox (degrees). */
export async function listingIdsInBbox(bbox: Bbox, limit = 2500): Promise<string[]> {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM listings
    WHERE deleted_at IS NULL
      AND status = 'active'
      AND location IS NOT NULL
      AND ST_Intersects(
        location::geometry,
        ST_MakeEnvelope(${bbox.west}, ${bbox.south}, ${bbox.east}, ${bbox.north}, 4326)
      )
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return rows.map((r) => r.id)
}

/** Meters from listing to a point (null if no location). */
export async function listingDistanceM(
  listingId: string,
  lat: number,
  lng: number,
): Promise<number | null> {
  const rows = await db.$queryRaw<{ m: number }[]>`
    SELECT ST_Distance(
      location,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    )::float8 AS m
    FROM listings
    WHERE id = ${listingId} AND location IS NOT NULL
  `
  return rows[0]?.m ?? null
}

/** Self-check SQL fragment used by postgis.check.ts */
export const POSTGIS_SMOKE_SQL = Prisma.sql`
  SELECT PostGIS_Version() AS v
`
