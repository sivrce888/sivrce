/**
 * GET /api/napr?code=01.10.10.025.115 — parcel by cadastral
 * GET /api/napr?lat=&lng= — parcel under pin
 * GET /api/napr?health=1 — maps.gov.ge (+ CadRepGeo fallback) up/down
 */

import { type NextRequest, NextResponse } from 'next/server'
import { cdnJson } from '@/lib/cdn-cache'
import {
  fetchNaprParcelAt,
  fetchNaprParcelByCode,
  probeNaprCadRep,
} from '@/lib/map/napr-parcel'
import { isSameOrigin } from '@/lib/security/origin'

export const maxDuration = 8
export const preferredRegion = 'fra1'

export async function GET(req: NextRequest) {
  if (!isSameOrigin(req) && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'bad_origin' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  if (sp.get('health') === '1') {
    const up = await probeNaprCadRep()
    return NextResponse.json(
      { ok: up, service: 'maps.gov.ge' },
      { status: up ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const code = sp.get('code')?.trim() ?? ''
  if (code) {
    const parcel = await fetchNaprParcelByCode(code)
    if (!parcel) {
      // ponytail: 404 covers both missing parcel and upstream outage (retry client-side).
      return cdnJson({ ok: false, error: 'not_found' }, 60, 404)
    }
    return cdnJson({ ok: true, source: parcel.source ?? 'maps.gov.ge', ...parcel })
  }

  const lat = Number(sp.get('lat'))
  const lng = Number(sp.get('lng'))
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const parcel = await fetchNaprParcelAt(lat, lng)
    if (!parcel) {
      return cdnJson({ ok: false, error: 'not_found' }, 60, 404)
    }
    return cdnJson({ ok: true, source: parcel.source ?? 'maps.gov.ge', ...parcel })
  }

  return NextResponse.json({ ok: false, error: 'need_code_or_latlng' }, { status: 400 })
}
