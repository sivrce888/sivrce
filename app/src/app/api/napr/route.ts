/**
 * GET /api/napr?code=01.10.10.025.115 — parcel by cadastral
 * GET /api/napr?lat=&lng= — parcel under pin
 */

import { type NextRequest, NextResponse } from 'next/server'
import {
  fetchNaprParcelAt,
  fetchNaprParcelByCode,
} from '@/lib/map/napr-parcel'
import { isSameOrigin } from '@/lib/security/origin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(req: NextRequest) {
  if (!isSameOrigin(req) && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'bad_origin' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const code = sp.get('code')?.trim() ?? ''
  if (code) {
    const parcel = await fetchNaprParcelByCode(code)
    if (!parcel) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, ...parcel })
  }

  const lat = Number(sp.get('lat'))
  const lng = Number(sp.get('lng'))
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const parcel = await fetchNaprParcelAt(lat, lng)
    if (!parcel) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, ...parcel })
  }

  return NextResponse.json({ ok: false, error: 'need_code_or_latlng' }, { status: 400 })
}
