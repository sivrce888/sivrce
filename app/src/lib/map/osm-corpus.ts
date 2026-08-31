/**
 * OSM building corpus — PostGIS-backed national footprints.
 * Lookup by pin; write-through from Overpass / ingest script.
 * ponytail: point GIST + ring JSON; upgrade → polygon geom when map needs ST_Intersects.
 * db imported lazily so pure helpers stay checkable without DATABASE_URL.
 */

import type { OsmBuildingHit } from './osm-building-ring'
import { ringCentroid } from './pick-building'

export type CorpusCity = 'tbilisi' | 'batumi' | 'kutaisi' | 'rustavi' | 'other'

function asRing(raw: unknown): [number, number][] | null {
  if (!Array.isArray(raw) || raw.length < 5) return null
  const out: [number, number][] = []
  for (const p of raw) {
    if (!Array.isArray(p) || p.length < 2) return null
    const lng = Number(p[0])
    const lat = Number(p[1])
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
    out.push([lng, lat])
  }
  return out.length >= 5 ? out : null
}

/** Pure: ring JSON parse — self-checkable. */
export function parseCorpusRing(raw: unknown): [number, number][] | null {
  return asRing(raw)
}

/** Guess city bucket from pin (coarse). */
export function corpusCityAt(lat: number, lng: number): CorpusCity {
  if (lat >= 41.62 && lat <= 41.85 && lng >= 44.68 && lng <= 45.0) return 'tbilisi'
  if (lat >= 41.58 && lat <= 41.7 && lng >= 41.58 && lng <= 41.72) return 'batumi'
  if (lat >= 42.22 && lat <= 42.32 && lng >= 42.65 && lng <= 42.78) return 'kutaisi'
  if (lat >= 41.5 && lat <= 41.6 && lng >= 44.95 && lng <= 45.1) return 'rustavi'
  return 'other'
}

/** Nearest corpus building within radiusM (PostGIS). */
export async function fetchCorpusBuildingNear(
  lat: number,
  lng: number,
  radiusM = 70,
): Promise<OsmBuildingHit | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const { db, dbAvailable } = await import('@/lib/db')
  if (!(await dbAvailable())) return null
  try {
    const rows = await db.$queryRaw<
      Array<{
        osm_id: bigint
        levels: number | null
        height_m: number | null
        name: string | null
        building: string | null
        ring: unknown
      }>
    >`
      SELECT osm_id, levels, height_m, name, building, ring
      FROM osm_buildings
      WHERE location IS NOT NULL
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusM}
        )
      ORDER BY ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      )
      LIMIT 1
    `
    const row = rows[0]
    if (!row) return null
    const ring = asRing(row.ring)
    if (!ring) return null
    return {
      ring,
      osmId: Number(row.osm_id),
      ...(row.levels != null && row.levels > 0 ? { levels: row.levels } : {}),
      ...(row.height_m != null && row.height_m > 0 ? { heightM: row.height_m } : {}),
      ...(row.name ? { name: row.name } : {}),
      ...(row.building ? { building: row.building } : {}),
    }
  } catch {
    return null
  }
}

/** Upsert one Overpass hit into corpus (write-through). */
export async function upsertCorpusBuilding(
  hit: OsmBuildingHit,
  city: CorpusCity = 'other',
): Promise<void> {
  if (!hit.osmId || hit.ring.length < 5) return
  const { db, dbAvailable } = await import('@/lib/db')
  if (!(await dbAvailable())) return
  const c = ringCentroid(hit.ring)
  try {
    await db.$executeRaw`
      INSERT INTO osm_buildings (
        osm_id, osm_type, city, lat, lng, levels, height_m, name, building, ring, updated_at
      ) VALUES (
        ${hit.osmId},
        'way',
        ${city},
        ${c.lat},
        ${c.lng},
        ${hit.levels ?? null},
        ${hit.heightM ?? null},
        ${hit.name ?? null},
        ${hit.building ?? null},
        ${JSON.stringify(hit.ring)}::jsonb,
        NOW()
      )
      ON CONFLICT (osm_id) DO UPDATE SET
        city = EXCLUDED.city,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        levels = EXCLUDED.levels,
        height_m = EXCLUDED.height_m,
        name = EXCLUDED.name,
        building = EXCLUDED.building,
        ring = EXCLUDED.ring,
        updated_at = NOW()
    `
  } catch {
    /* corpus optional — never break site lookup */
  }
}

/** Buildings whose centroid falls in a WGS84 bbox (map paint). */
export async function fetchCorpusInBbox(
  bbox: { west: number; south: number; east: number; north: number },
  limit = 800,
): Promise<OsmBuildingHit[]> {
  const { db, dbAvailable } = await import('@/lib/db')
  if (!(await dbAvailable())) return []
  const lim = Math.min(Math.max(1, limit), 2000)
  try {
    const rows = await db.$queryRaw<
      Array<{
        osm_id: bigint
        levels: number | null
        height_m: number | null
        name: string | null
        building: string | null
        ring: unknown
      }>
    >`
      SELECT osm_id, levels, height_m, name, building, ring
      FROM osm_buildings
      WHERE location IS NOT NULL
        AND ST_Intersects(
          location::geometry,
          ST_MakeEnvelope(${bbox.west}, ${bbox.south}, ${bbox.east}, ${bbox.north}, 4326)
        )
      LIMIT ${lim}
    `
    const out: OsmBuildingHit[] = []
    for (const row of rows) {
      const ring = asRing(row.ring)
      if (!ring) continue
      out.push({
        ring,
        osmId: Number(row.osm_id),
        ...(row.levels != null && row.levels > 0 ? { levels: row.levels } : {}),
        ...(row.height_m != null && row.height_m > 0 ? { heightM: row.height_m } : {}),
        ...(row.name ? { name: row.name } : {}),
        ...(row.building ? { building: row.building } : {}),
      })
    }
    return out
  } catch {
    return []
  }
}
