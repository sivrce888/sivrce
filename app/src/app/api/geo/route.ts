/**
 * GET /api/geo — city-level place from Vercel IP headers (no third-party IP API).
 * Local/dev without headers → empty body (client keeps last place / Tbilisi).
 */

import { NextResponse } from 'next/server'
import { marketFromIso } from '@/lib/geo-market'
import { placeFromIp } from '@/lib/map/user-place.server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 3

function header(req: Request, name: string): string | null {
  const v = req.headers.get(name)
  return v && v !== 'undefined' ? v : null
}

export async function GET(req: Request) {
  const lat = Number(header(req, 'x-vercel-ip-latitude'))
  const lng = Number(header(req, 'x-vercel-ip-longitude'))
  const cityName = header(req, 'x-vercel-ip-city')
  const country = header(req, 'x-vercel-ip-country')
  const market = marketFromIso(country)

  const city = placeFromIp(lat, lng, cityName)
  if (!city) {
    return NextResponse.json(
      { ok: false as const, reason: 'unknown', country, market },
      { status: 200 },
    )
  }

  return NextResponse.json(
    {
      ok: true as const,
      slug: city.slug,
      ka: city.ka,
      en: city.en,
      lat: city.lat,
      lng: city.lng,
      cc: city.cc,
      country,
      market,
      source: 'ip' as const,
    },
    {
      headers: { 'Cache-Control': 'private, max-age=300' },
    },
  )
}
