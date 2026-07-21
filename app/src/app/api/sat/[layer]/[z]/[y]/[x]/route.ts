/**
 * GET /api/sat/[layer]/[z]/[y]/[x] — same-origin Esri imagery/ref tiles.
 * Layers: img | roads | labels
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UPSTREAM: Record<string, string> = {
  img: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile',
  roads:
    'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile',
  labels:
    'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile',
}

type Ctx = { params: Promise<{ layer: string; z: string; y: string; x: string }> }

function okParam(v: string) {
  return /^\d{1,7}$/.test(v)
}

export async function GET(_req: Request, ctx: Ctx) {
  const { layer, z, y, x } = await ctx.params
  const base = UPSTREAM[layer]
  if (!base || !okParam(z) || !okParam(y) || !okParam(x)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const upstream = `${base}/${z}/${y}/${x}`
  let res: Response
  try {
    res = await fetch(upstream, {
      headers: { Accept: 'image/*' },
      cache: 'force-cache',
    })
  } catch {
    return new NextResponse('Upstream unavailable', { status: 502 })
  }
  if (!res.ok) return new NextResponse(null, { status: res.status === 404 ? 404 : 502 })

  const headers = new Headers()
  headers.set('Content-Type', res.headers.get('Content-Type') ?? 'image/jpeg')
  headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable')
  headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=86400, immutable')
  headers.set('X-Content-Type-Options', 'nosniff')
  return new NextResponse(res.body, { status: 200, headers })
}
