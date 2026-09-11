/**
 * GET /api/tiles/[layer]/[z]/[x]/[y] — MapLibre vector tiles from PostGIS.
 * Never returns raw GeoJSON city dumps.
 */

import { NextResponse } from 'next/server'
import {
  isTileLayer,
  layerZoomOk,
  mvtCacheHeaders,
  mvtForTile,
  parseTileXYZ,
} from '@/lib/geo/mvt'
import { clientIp, rateLimitOk } from '@/lib/reviews/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 8

type Ctx = { params: Promise<{ layer: string; z: string; x: string; y: string }> }

export async function GET(req: Request, ctx: Ctx) {
  if (!rateLimitOk(`tiles:${clientIp(req.headers)}`, { windowMs: 10_000, max: 120 })) {
    return new NextResponse(null, { status: 429, headers: { 'Retry-After': '2' } })
  }
  const { layer: rawLayer, z, x, y } = await ctx.params
  const layer = rawLayer?.replace(/\.mvt$/i, '') ?? ''
  if (!isTileLayer(layer)) {
    return NextResponse.json({ error: 'unknown_layer' }, { status: 404 })
  }
  const xyz = parseTileXYZ(z, x, y)
  if (!xyz) {
    return NextResponse.json({ error: 'bad_tile' }, { status: 400 })
  }
  if (!layerZoomOk(layer, xyz.z)) {
    // Empty MVT — MapLibre treats as no features (keeps progressive detail).
    return new NextResponse(Buffer.alloc(0), { status: 200, headers: mvtCacheHeaders(300) })
  }
  try {
    const buf = await mvtForTile(layer, xyz.z, xyz.x, xyz.y)
    // Buffer<ArrayBufferLike> fails DOM BodyInit typing; Uint8Array copy is a valid BodyInit.
    return new NextResponse(new Uint8Array(buf), { status: 200, headers: mvtCacheHeaders(3600) })
  } catch (err) {
    console.error('[tiles]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'tile_failed' }, { status: 500 })
  }
}
