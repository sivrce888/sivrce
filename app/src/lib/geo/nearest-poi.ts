/**
 * Seed `pois` from committed tbilisi-pois.json + recompute listing_nearest_poi.
 * Map JSON categories → PoiKind enum (university/gym → other; shop → supermarket).
 */

import type { PoiKind } from "@/generated/prisma/client"
import raw from "@/data/tbilisi-pois.json"
import { db } from "@/lib/db"
import { METRO_MAX_CATCHMENT_M } from "@/lib/geo/nearest-poi-constants"
import { poiUuid } from "@/lib/geo/nearest-poi-pure"

export { nearMetroWhere, METRO_NEAR_M, poiUuid } from "@/lib/geo/nearest-poi-pure"

type JsonPoi = { id: string; category: string; name: string; lat: number; lng: number }

const CAT_TO_KIND: Record<string, PoiKind> = {
  metro: "metro",
  pharmacy: "pharmacy",
  school: "school",
  university: "other",
  park: "park",
  shop: "supermarket",
  gym: "other",
  hospital: "hospital",
}

export async function seedPoisFromJson(): Promise<{ upserted: number }> {
  const pois = (raw as { pois: JsonPoi[] }).pois
  let upserted = 0
  for (const p of pois) {
    const kind = CAT_TO_KIND[p.category]
    if (!kind) continue
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue
    const id = poiUuid(p.id)
    await db.$executeRaw`
      INSERT INTO pois (id, kind, name_ka, name_en, location, is_active, metadata, created_at, updated_at)
      VALUES (
        ${id}::uuid,
        ${kind}::poi_kind,
        ${p.name},
        ${p.name},
        ST_SetSRID(ST_MakePoint(${p.lng}, ${p.lat}), 4326)::geography,
        true,
        ${JSON.stringify({ osmId: p.id, category: p.category })}::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        kind = EXCLUDED.kind,
        name_ka = EXCLUDED.name_ka,
        name_en = EXCLUDED.name_en,
        location = EXCLUDED.location,
        is_active = true,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `
    upserted += 1
  }
  return { upserted }
}

/** Nearest POI per kind within catchment; replaces rows for this listing. */
export async function recomputeNearestPois(listingId: string): Promise<number> {
  await db.$executeRaw`
    DELETE FROM listing_nearest_poi WHERE listing_id = ${listingId}
  `
  const inserted = await db.$executeRaw`
    INSERT INTO listing_nearest_poi (listing_id, poi_id, poi_kind, distance_m, walk_time_min)
    SELECT
      ${listingId},
      sub.id,
      sub.kind,
      sub.dist_m,
      GREATEST(1, ROUND(sub.dist_m / 80.0))::int
    FROM (
      SELECT DISTINCT ON (p.kind)
        p.id,
        p.kind,
        ST_Distance(l.location, p.location)::int AS dist_m
      FROM listings l
      JOIN pois p ON p.is_active
        AND ST_DWithin(l.location, p.location, ${METRO_MAX_CATCHMENT_M})
      WHERE l.id = ${listingId}
        AND l.location IS NOT NULL
      ORDER BY p.kind, l.location <-> p.location
    ) sub
  `
  return Number(inserted)
}

/** Batch: listings missing metro nearest, or all active (limit). */
export async function recomputeNearestPoisBatch(opts?: {
  limit?: number
  forceAll?: boolean
}): Promise<{ listings: number; links: number }> {
  const limit = opts?.limit ?? 200
  const ids = opts?.forceAll
    ? (
        await db.listing.findMany({
          where: { deletedAt: null, status: "active" },
          select: { id: true },
          take: limit,
          orderBy: { updatedAt: "desc" },
        })
      ).map((r) => r.id)
    : (
        await db.$queryRaw<{ id: string }[]>`
          SELECT l.id
          FROM listings l
          WHERE l.deleted_at IS NULL
            AND l.status = 'active'
            AND l.location IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM listing_nearest_poi n
              WHERE n.listing_id = l.id AND n.poi_kind = 'metro'
            )
          ORDER BY l.created_at DESC
          LIMIT ${limit}
        `
      ).map((r) => r.id)

  let links = 0
  for (const id of ids) {
    links += await recomputeNearestPois(id)
  }
  return { listings: ids.length, links }
}
