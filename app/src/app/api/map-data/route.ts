/**
 * GET /api/map-data — listings + buildings for map refresh.
 * ponytail: 30s CDN — Refresh is still "new ads", not a function per pan.
 */

import { NextResponse } from 'next/server'
import { cdnJson } from '@/lib/cdn-cache'
import { loadMapDataFresh } from '@/lib/map/db-buildings'

export const maxDuration = 10
export const preferredRegion = 'fra1'

export async function GET() {
  try {
    const data = await loadMapDataFresh()
    return cdnJson({
      listings: data.listings,
      buildings: data.buildings,
      listingCount: data.listings.length,
      buildingCount: data.buildings.length,
      at: Date.now(),
    }, 30)
  } catch (err) {
    console.error('[map-data]', err)
    return NextResponse.json({ error: 'map refresh failed' }, { status: 500 })
  }
}
