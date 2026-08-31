/**
 * GET /api/site?code=01.10.10.025.115 — NAPR + OSM + TAS permits at parcel
 * GET /api/site?lat=&lng= — pin: parcel + OSM + TAS shapes
 *
 * ring = building preferred (corpus/OSM), else parcel (map paint).
 * tasShapes / tasDocs = Architecture Service (tas.ge) public data.
 * Write-through: Overpass hits cached into osm_buildings.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { cdnJson } from '@/lib/cdn-cache'
import { lookupSite } from '@/lib/map/site-lookup'
import { isSameOrigin } from '@/lib/security/origin'

export const maxDuration = 8
export const preferredRegion = 'fra1'

export async function GET(req: NextRequest) {
  if (!isSameOrigin(req) && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'bad_origin' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const code = sp.get('code')?.trim() ?? ''
  const lat = Number(sp.get('lat'))
  const lng = Number(sp.get('lng'))

  const site = await lookupSite({
    code: code || null,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  })

  if (!site) {
    if (!code && !(Number.isFinite(lat) && Number.isFinite(lng))) {
      return NextResponse.json({ ok: false, error: 'need_code_or_latlng' }, { status: 400 })
    }
    return cdnJson({ ok: false, error: 'not_found' }, 60, 404)
  }

  if (
    !site.parcel &&
    !site.building &&
    !site.tasShapes.length &&
    !site.tasDocs.length
  ) {
    return cdnJson({ ok: false, error: 'not_found' }, 60, 404)
  }

  return cdnJson({
    ok: true,
    lat: site.lat,
    lng: site.lng,
    ring: site.ring,
    ringSource: site.ringSource,
    parcel: site.parcel,
    building: site.building,
    tasShapes: site.tasShapes,
    tasDocs: site.tasDocs,
  })
}
