/**
 * GET /api/geo — city-level place from Vercel IP headers (no third-party IP API).
 * Local/dev without headers → empty body (client keeps Tbilisi / memory).
 */

import { NextResponse } from 'next/server'
import { cityBySlug, nearestMapCity, type MapCity } from '@/lib/map/user-place'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type GeoBody = {
  slug: string
  ka: string
  lat: number
  lng: number
  source: 'ip'
}

function header(req: Request, name: string): string | null {
  const v = req.headers.get(name)
  return v && v !== 'undefined' ? v : null
}

function fromCoords(lat: number, lng: number): MapCity | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return nearestMapCity(lat, lng)
}

/** Match Vercel city string against our registry (en / slug). */
function fromCityName(raw: string): MapCity | null {
  const q = raw.trim().toLowerCase()
  if (!q) return null
  const aliases: Record<string, string> = {
    tbilisi: 'tbilisi',
    tiflis: 'tbilisi',
    batumi: 'batumi',
    batoum: 'batumi',
    kutaisi: 'kutaisi',
    rustavi: 'rustavi',
    poti: 'poti',
    zugdidi: 'zugdidi',
    telavi: 'telavi',
    gori: 'gori',
    mtskheta: 'mtskheta',
    bakuriani: 'bakuriani',
    borjomi: 'borjomi',
    gudauri: 'gudauri',
  }
  const slug = aliases[q]
  return slug ? cityBySlug(slug) : null
}

export async function GET(req: Request) {
  const country = header(req, 'x-vercel-ip-country')
  // Product is Georgia-first — skip soft chip for foreign IPs.
  if (country && country !== 'GE') {
    return NextResponse.json({ ok: false as const, reason: 'outside_ge' }, { status: 200 })
  }

  const lat = Number(header(req, 'x-vercel-ip-latitude'))
  const lng = Number(header(req, 'x-vercel-ip-longitude'))
  const cityName = header(req, 'x-vercel-ip-city')

  const city = fromCoords(lat, lng) ?? (cityName ? fromCityName(cityName) : null)
  if (!city) {
    return NextResponse.json({ ok: false as const, reason: 'unknown' }, { status: 200 })
  }

  const body: GeoBody & { ok: true } = {
    ok: true,
    slug: city.slug,
    ka: city.ka,
    lat: city.lat,
    lng: city.lng,
    source: 'ip',
  }
  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
