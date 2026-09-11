/**
 * Vector-tile (MVT) generation from geo_features.
 * Deterministic PostGIS only — AI never invents geometry.
 * ponytail: ST_AsMVT in-process; upgrade → Martin/pg_tileserv when QPS hurts.
 */

import { Prisma } from '@/generated/prisma/client'

/** Allowed public tile layers → geo_features.kind values. */
export const TILE_LAYERS = {
  buildings: ['alkis_building'],
  parcels: ['alkis_parcel'],
  step: ['step_potential', 'step_quartier', 'step_priority', 'step_gemeinwohl', 'step_konzept'],
  developments: ['step_potential', 'step_quartier'],
} as const

export type TileLayer = keyof typeof TILE_LAYERS

export function isTileLayer(s: string): s is TileLayer {
  return Object.prototype.hasOwnProperty.call(TILE_LAYERS, s)
}

/** Progressive detail: refuse empty/huge zooms that would dump city geometry. */
export function layerZoomOk(layer: TileLayer, z: number): boolean {
  if (!Number.isInteger(z) || z < 0 || z > 22) return false
  switch (layer) {
    case 'buildings':
      return z >= 14 && z <= 18
    case 'parcels':
      return z >= 16 && z <= 19
    case 'step':
      return z >= 9 && z <= 16
    case 'developments':
      return z >= 10 && z <= 16
    default: {
      const _exhaustive: never = layer
      return _exhaustive
    }
  }
}

export function parseTileXYZ(z: string, x: string, y: string): { z: number; x: number; y: number } | null {
  const zi = Number(z)
  const xi = Number(x)
  const yi = Number(y)
  if (![zi, xi, yi].every((n) => Number.isInteger(n) && n >= 0)) return null
  const max = 2 ** zi
  if (xi >= max || yi >= max) return null
  return { z: zi, x: xi, y: yi }
}

/** WebMercator tile → MVT bytes for one layer. Empty buffer when no features. */
export async function mvtForTile(
  layer: TileLayer,
  z: number,
  x: number,
  y: number,
): Promise<Buffer> {
  const { db } = await import('@/lib/db')
  const kinds = TILE_LAYERS[layer]
  const rows = await db.$queryRaw<{ tile: Buffer | null }[]>`
    WITH bounds AS (
      SELECT ST_TileEnvelope(${z}::int, ${x}::int, ${y}::int) AS geom
    ),
    clipped AS (
      SELECT
        g.external_id AS id,
        g.name,
        g.kind,
        COALESCE((g.props->>'height_m')::float8, 12)::float8 AS height,
        COALESCE(g.props->>'we_kat', '') AS we_kat,
        COALESCE(g.props->>'status', g.props->>'leg_fertig', '') AS status,
        ST_AsMVTGeom(
          ST_Transform(g.geom, 3857),
          bounds.geom,
          4096,
          64,
          true
        ) AS geom
      FROM geo_features g
      CROSS JOIN bounds
      WHERE g.kind IN (${Prisma.join(kinds)})
        AND g.geom && ST_Transform(bounds.geom, 4326)
        AND ST_Intersects(g.geom, ST_Transform(bounds.geom, 4326))
    )
    SELECT ST_AsMVT(clipped.*, 'features', 4096, 'geom') AS tile
    FROM clipped
    WHERE geom IS NOT NULL
  `
  const tile = rows[0]?.tile
  return tile && Buffer.isBuffer(tile) ? tile : Buffer.from(tile ?? [])
}

/** CDN headers for immutable-ish tiles (source refresh ≤ weekly). */
export function mvtCacheHeaders(sMaxAge = 3600): HeadersInit {
  return {
    'Content-Type': 'application/vnd.mapbox-vector-tile',
    'Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 24}`,
    'Vercel-CDN-Cache-Control': `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 24}`,
  }
}
