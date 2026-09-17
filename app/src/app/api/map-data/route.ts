/**
 * GET /api/map-data — listings + buildings for map refresh.
 * ponytail: 30s CDN — Refresh is still "new ads", not a function per pan.
 */

import { NextResponse } from 'next/server'
import { cdnJson } from '@/lib/cdn-cache'
import { loadMapDataFresh } from '@/lib/map/db-buildings'
import { enforcedCountry, hostFromRequest, requestKind } from '@/lib/domain-scope'

export const maxDuration = 10

export async function GET(req: Request) {
  try {
    const kind = requestKind(hostFromRequest(req), process.env.VERCEL_ENV)
    const country = enforcedCountry(kind, new URL(req.url).searchParams.get('country'))
    const data = await loadMapDataFresh(country)
    return cdnJson({
      listings: data.listings,
      buildings: data.buildings,
      listingCount: data.listings.length,
      buildingCount: data.buildings.length,
      at: Date.now(),
    }, 30)
  } catch (err) {
    console.error('[map-data]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'map refresh failed' }, { status: 500 })
  }
}
