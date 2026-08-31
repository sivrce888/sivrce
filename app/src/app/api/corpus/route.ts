/**
 * GET /api/corpus?west=&south=&east=&north=&limit=800
 * OSM building footprints from national corpus (PostGIS).
 */

import { type NextRequest, NextResponse } from 'next/server'
import { cdnJson } from '@/lib/cdn-cache'
import { fetchCorpusInBbox } from '@/lib/map/osm-corpus'
import { isSameOrigin } from '@/lib/security/origin'

export const maxDuration = 8
export const preferredRegion = 'fra1'

export async function GET(req: NextRequest) {
  if (!isSameOrigin(req) && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'bad_origin' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const west = Number(sp.get('west'))
  const south = Number(sp.get('south'))
  const east = Number(sp.get('east'))
  const north = Number(sp.get('north'))
  const limit = Number(sp.get('limit') ?? 800)

  if (
    ![west, south, east, north].every(Number.isFinite) ||
    west >= east ||
    south >= north
  ) {
    return NextResponse.json({ ok: false, error: 'need_bbox' }, { status: 400 })
  }

  // ponytail: reject country-sized bboxes (client must zoom in).
  if (east - west > 0.15 || north - south > 0.15) {
    return NextResponse.json({ ok: false, error: 'bbox_too_large' }, { status: 400 })
  }

  const buildings = await fetchCorpusInBbox({ west, south, east, north }, limit)
  return cdnJson({
    ok: true,
    count: buildings.length,
    buildings,
    attribution: '© OpenStreetMap contributors (ODbL)',
  }, 60)
}
