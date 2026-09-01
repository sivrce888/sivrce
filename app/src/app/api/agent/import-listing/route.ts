import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/auth'
import {
  formatImportedListing,
  importCompetitorListings,
} from '@/lib/competitor-import'
import { checkRateLimit } from '@/lib/inquiries/rate-limit'
import { isSameOrigin } from '@/lib/security/origin'

export const runtime = 'nodejs'
export const maxDuration = 45

type Body = { urls?: string[]; format?: 'json' | 'text' }

/** POST { "urls": ["https://ss.ge/...", "https://myhome.ge/..."] } → normalized cards + best pick. */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: 'bad_origin' }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const limit = checkRateLimit(`import-listing:${session.user.id}`)
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    )
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const urls = (body.urls ?? []).map((u) => String(u).trim()).filter(Boolean)
  if (!urls.length) {
    return NextResponse.json({ ok: false, error: 'urls_required' }, { status: 400 })
  }
  if (urls.length > 10) {
    return NextResponse.json({ ok: false, error: 'max_10_urls' }, { status: 400 })
  }

  try {
    const { listings, best } = await importCompetitorListings(urls)
    if (body.format === 'text') {
      const text = [
        best ? `★ საუკეთესო (${best.score}/100)\n${formatImportedListing(best)}` : null,
        listings.length > 1 ? '\n---\n' + listings.map(formatImportedListing).join('\n---\n') : null,
      ].filter(Boolean).join('\n')
      return new NextResponse(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }
    return NextResponse.json({
      ok: true,
      best,
      bestId: best?.sourceId ?? null,
      bestScore: best?.score ?? null,
      listings,
      cards: listings.map(formatImportedListing),
      bestCard: best ? formatImportedListing(best) : null,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'import_failed' },
      { status: 502 },
    )
  }
}
