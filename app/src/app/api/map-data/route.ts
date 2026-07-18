/**
 * GET /api/map-data — fresh listings + buildings for map refresh.
 * ponytail: bypasses unstable_cache so the rail Refresh button sees new ads.
 */

import { NextResponse } from 'next/server'
import { loadMapDataFresh } from '@/lib/map/db-buildings'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await loadMapDataFresh()
    return NextResponse.json({
      listings: data.listings,
      buildings: data.buildings,
      listingCount: data.listings.length,
      buildingCount: data.buildings.length,
      at: Date.now(),
    })
  } catch (err) {
    console.error('[map-data]', err)
    return NextResponse.json({ error: 'map refresh failed' }, { status: 500 })
  }
}
