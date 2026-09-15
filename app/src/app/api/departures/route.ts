/**
 * GET /api/departures?stop=<vbb-id> — live Berlin U/S-Bahn departures (VBB
 * HAFAS via v6.vbb.transport.rest, free). Rate-limited, CDN-cached 45 s —
 * all visitors of a station share one upstream call per window.
 */

import { NextResponse } from 'next/server'
import { getDepartures, isStopId } from '@/lib/de-live'
import { clientIp, rateLimitOk } from '@/lib/reviews/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 8

function cacheHeaders(): HeadersInit {
  const v = 'public, s-maxage=45, stale-while-revalidate=180'
  return {
    'Cache-Control': v,
    'Vercel-CDN-Cache-Control': v,
    'CDN-Cache-Control': v,
  }
}

export async function GET(req: Request) {
  if (!rateLimitOk(`departures:${clientIp(req.headers)}`, { windowMs: 10_000, max: 60 })) {
    return new NextResponse(null, { status: 429, headers: { 'Retry-After': '2' } })
  }
  const stop = new URL(req.url).searchParams.get('stop') ?? ''
  if (!isStopId(stop)) {
    return NextResponse.json({ error: 'bad_stop' }, { status: 400 })
  }
  const departures = await getDepartures(stop)
  if (!departures) {
    return NextResponse.json({ error: 'departures_failed' }, { status: 502 })
  }
  return NextResponse.json(
    { stop, departures, attribution: '© VBB / BVG' },
    { headers: cacheHeaders() },
  )
}
