/**
 * Upsert official Berlin/DE geometries into geo_features (PostGIS).
 * Deterministic — no AI geometry. Provenance columns required.
 */

import { createHash } from 'node:crypto'

export type GeoKind =
  | 'alkis_building'
  | 'alkis_parcel'
  | 'step_potential'
  | 'step_quartier'
  | 'step_priority'
  | 'step_gemeinwohl'
  | 'step_konzept'
  | 'bplan_festgesetzt'
  | 'bplan_verfahren'

export type GeoUpsert = {
  kind: GeoKind
  sourceSlug: string
  externalId: string
  name?: string | null
  props?: Record<string, unknown>
  /** GeoJSON geometry object (Polygon / MultiPolygon / Point). */
  geometry: GeoJSON.Geometry
  license?: string
  sourceUrl?: string | null
  retrievedAt?: Date
  confidence?: number
  city?: string
  country?: string
}

function ringToWkt(ring: number[][]): string {
  return ring.map((c) => `${c[0]} ${c[1]}`).join(',')
}

/** Pure: GeoJSON → WKT (EPSG:4326). Returns null if unsupported/empty. */
export function geoJsonToWkt(g: GeoJSON.Geometry): string | null {
  switch (g.type) {
    case 'Point': {
      const [lng, lat] = g.coordinates
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
      return `POINT(${lng} ${lat})`
    }
    case 'Polygon': {
      const rings = g.coordinates
      if (!rings?.[0] || rings[0].length < 4) return null
      return `POLYGON(${rings.map((r) => `(${ringToWkt(r)})`).join(',')})`
    }
    case 'MultiPolygon': {
      const polys = g.coordinates
      if (!polys?.length) return null
      const parts: string[] = []
      for (const poly of polys) {
        if (!poly?.[0] || poly[0].length < 4) continue
        parts.push(`(${poly.map((r) => `(${ringToWkt(r)})`).join(',')})`)
      }
      if (!parts.length) return null
      return `MULTIPOLYGON(${parts.join(',')})`
    }
    default:
      return null
  }
}

/** Stable external id when WFS omits uuid. */
export function geoExternalId(seed: string): string {
  return createHash('sha1').update(seed).digest('hex').slice(0, 32)
}

export async function upsertGeoFeature(row: GeoUpsert): Promise<boolean> {
  const wkt = geoJsonToWkt(row.geometry)
  if (!wkt) return false
  const { db } = await import('@/lib/db') // lazy: geo-features.check stays DB-free
  const props = JSON.stringify(row.props ?? {})
  const retrieved = row.retrievedAt ?? new Date()
  const confidence = Math.max(0, Math.min(100, row.confidence ?? 100))
  await db.$executeRaw`
    INSERT INTO geo_features (
      kind, city, country, source_slug, external_id, name, props,
      geom, lat, lng, license, source_url, retrieved_at, confidence
    ) VALUES (
      ${row.kind},
      ${row.city ?? 'berlin'},
      ${row.country ?? 'DE'},
      ${row.sourceSlug},
      ${row.externalId},
      ${row.name ?? null},
      ${props}::jsonb,
      ST_SetSRID(ST_GeomFromText(${wkt}), 4326),
      0, 0,
      ${row.license ?? 'dl-de-zero-2.0'},
      ${row.sourceUrl ?? null},
      ${retrieved},
      ${confidence}
    )
    ON CONFLICT (source_slug, external_id) DO UPDATE SET
      kind = EXCLUDED.kind,
      name = EXCLUDED.name,
      props = EXCLUDED.props,
      geom = EXCLUDED.geom,
      license = EXCLUDED.license,
      source_url = EXCLUDED.source_url,
      retrieved_at = EXCLUDED.retrieved_at,
      confidence = EXCLUDED.confidence,
      updated_at = NOW()
  `
  return true
}

export async function upsertGeoFeatures(rows: GeoUpsert[]): Promise<number> {
  let n = 0
  for (const r of rows) {
    try {
      if (await upsertGeoFeature(r)) n++
    } catch (e) {
      console.warn('geo upsert fail', r.externalId, e instanceof Error ? e.message : e)
    }
  }
  return n
}

/** Batch ring → Polygon for ALKIS footprints. */
export function ringToPolygon(ring: [number, number][]): GeoJSON.Polygon {
  return { type: 'Polygon', coordinates: [ring] }
}
