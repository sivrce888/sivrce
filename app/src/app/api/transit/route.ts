/**
 * GET /api/transit?bbox=w,s,e,n&cats=bus,tram,rail — live stops + amenities
 * (Berlin, Germany, worldwide) via Overpass. Bbox-capped, rate-limited,
 * CDN-cached for a day — one viewport, one cheap upstream call.
 */

import { NextResponse } from 'next/server'
import {
  TRANSIT_MAX,
  TRANSIT_SMAXAGE,
  parseOverpass,
  parseTransitParams,
  transitQuery,
} from '@/lib/map/transit'
import { clientIp, rateLimitOk } from '@/lib/reviews/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 8

const UA = 'sivrce-maps/1.0 (sivrce888@gmail.com)'
const UPSTREAMS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

function cacheHeaders(): HeadersInit {
  const v = `public, s-maxage=${TRANSIT_SMAXAGE}, stale-while-revalidate=${TRANSIT_SMAXAGE * 7}`
  return {
    'Cache-Control': v,
    'Vercel-CDN-Cache-Control': v,
    'CDN-Cache-Control': v,
  }
}

async function overpass(ql: string): Promise<{ elements?: unknown[] } | null> {
  for (const api of UPSTREAMS) {
    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(ql)}`,
        signal: AbortSignal.timeout(12_000),
        cache: 'no-store',
      })
      if (!res.ok) continue
      return (await res.json()) as { elements?: unknown[] }
    } catch {
      // next upstream
    }
  }
  return null
}

export async function GET(req: Request) {
  if (!rateLimitOk(`transit:${clientIp(req.headers)}`, { windowMs: 10_000, max: 60 })) {
    return new NextResponse(null, { status: 429, headers: { 'Retry-After': '2' } })
  }
  const url = new URL(req.url)
  const parsed = parseTransitParams(url.searchParams.get('bbox'), url.searchParams.get('cats'))
  if (!parsed) {
    return NextResponse.json({ error: 'bad_bbox' }, { status: 400 })
  }
  const json = await overpass(transitQuery(parsed.cats, parsed.bbox))
  if (!json) {
    return NextResponse.json({ error: 'transit_failed' }, { status: 502 })
  }
  const stops = parseOverpass(
    json as { elements?: { type: string; id: number | string }[] },
    parsed.cats,
    TRANSIT_MAX,
  )
  return NextResponse.json(
    { stops, attribution: '© OpenStreetMap contributors (ODbL)' },
    { headers: cacheHeaders() },
  )
}
