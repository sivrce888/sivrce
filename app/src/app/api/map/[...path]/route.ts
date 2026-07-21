/**
 * GET /api/map/* — same-origin proxy for basemap tiles/styles/fonts/sprites.
 * Hides upstream vendor host from the browser Network tab.
 */

import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'
import { mapProxyPathOk, OFM_ORIGIN, scrubMapJson } from '@/lib/map/map-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ path: string[] }> }

export async function GET(req: Request, ctx: Ctx) {
  const parts = (await ctx.params).path ?? []
  const path = parts.map(decodeURIComponent).join('/')
  if (!mapProxyPathOk(path)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const reqUrl = new URL(req.url)
  reqUrl.searchParams.delete('v') // cache-buster only — never send to OFM
  const upstream = `${OFM_ORIGIN}/${path}${reqUrl.search}`
  let res: Response
  try {
    res = await fetch(upstream, {
      headers: { Accept: req.headers.get('Accept') ?? '*/*' },
      // ponytail: edge/CDN cache via Cache-Control below; no Next data cache for pbf churn
      cache: 'force-cache',
    })
  } catch {
    return new NextResponse('Upstream unavailable', { status: 502 })
  }

  if (!res.ok) {
    return new NextResponse(null, { status: res.status === 404 ? 404 : 502 })
  }

  const headers = new Headers()
  const ct = res.headers.get('Content-Type') ?? ''
  if (ct) headers.set('Content-Type', ct)
  // fetch() already decompresses — never forward Content-Encoding.
  const isStyle = path.startsWith('styles/')
  // ponytail: short style/planet TTL — scrub bugs must not stick on CDN for an hour
  headers.set(
    'Cache-Control',
    isStyle || path === 'planet'
      ? 'public, max-age=120, stale-while-revalidate=3600'
      : 'public, max-age=86400, immutable',
  )
  headers.set('X-Content-Type-Options', 'nosniff')

  // Rewrite JSON so Network never shows upstream host. Absolute URLs — MapLibre workers.
  if (ct.includes('json') || path.startsWith('styles/') || path === 'planet') {
    const origin = new URL(req.url).origin
    const cacheVer = await getConfig('map.jsonCacheVer')
    const text = scrubMapJson(await res.text(), origin, cacheVer)
    return new NextResponse(text, { status: 200, headers })
  }

  return new NextResponse(res.body, { status: 200, headers })
}
