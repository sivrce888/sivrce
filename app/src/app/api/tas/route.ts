/**
 * GET /api/tas?lat=&lng= — architecture permit shapes near pin (WFS)
 * GET /api/tas?code=01.10.10.025.115 — public permits by cadastral (DWR)
 * GET /api/tas?docNo=AR11139083 — public permits by application №
 * GET /api/tas?docId=1139083 — permit detail + PDF attachment links
 * GET /api/tas?health=1 — GeoServer WFS up/down
 */

import { type NextRequest, NextResponse } from 'next/server'
import { cdnJson } from '@/lib/cdn-cache'
import {
  fetchTasDocDetail,
  fetchTasDocsByCadastral,
  fetchTasDocsByDocumentNo,
  fetchTasShapesAt,
  probeTasArch,
} from '@/lib/map/tas-arch'
import { isSameOrigin } from '@/lib/security/origin'

export const maxDuration = 8
export const preferredRegion = 'fra1'

export async function GET(req: NextRequest) {
  if (!isSameOrigin(req) && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'bad_origin' }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  if (sp.get('health') === '1') {
    const up = await probeTasArch()
    return NextResponse.json(
      { ok: up, service: 'tas-ARCHITECTURE_LR' },
      { status: up ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const docId = Number(sp.get('docId'))
  if (Number.isFinite(docId) && docId > 0) {
    const detail = await fetchTasDocDetail(docId)
    if (!detail) return cdnJson({ ok: false, error: 'not_found' }, 60, 404)
    return cdnJson({ ok: true, source: 'tas', detail })
  }

  const code = sp.get('code')?.trim() ?? ''
  if (code) {
    const docs = await fetchTasDocsByCadastral(code)
    return cdnJson({ ok: true, source: 'tas', code, docs, count: docs.length })
  }

  const docNo = sp.get('docNo')?.trim() ?? ''
  if (docNo) {
    const docs = await fetchTasDocsByDocumentNo(docNo)
    return cdnJson({ ok: true, source: 'tas', docNo, docs, count: docs.length })
  }

  const lat = Number(sp.get('lat'))
  const lng = Number(sp.get('lng'))
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const shapes = await fetchTasShapesAt(lat, lng)
    return cdnJson({ ok: true, source: 'tas', lat, lng, shapes, count: shapes.length })
  }

  return NextResponse.json(
    { ok: false, error: 'need_latlng_or_code_or_doc' },
    { status: 400 },
  )
}
