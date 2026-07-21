/**
 * POST /api/listings/[id]/view — bump listing view count.
 * Client fires once per browser session (sessionStorage); this route
 * rate-limits by IP so refresh spam doesn't inflate analytics.
 */
import { db } from '@/lib/db'
import { clientIp, rateLimitOk } from '@/lib/reviews/rate-limit'
import { isSameOrigin } from '@/lib/security/origin'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) {
    return Response.json({ ok: false, error: 'bad_origin' }, { status: 403 })
  }

  const { id } = await ctx.params
  if (!id || id.length > 120) {
    return Response.json({ ok: false, error: 'bad_id' }, { status: 400 })
  }

  // ponytail: reuse reviews limiter (10 / 10min). Ceiling: shared IP NAT;
  // upgrade to cookie+IP dedupe if view inflation becomes a problem.
  if (!rateLimitOk(`view:${clientIp(req.headers)}`)) {
    return Response.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  try {
    // Active + not deleted only — updateMany so non-unique filters are legal.
    const res = await db.listing.updateMany({
      where: { id, deletedAt: null, status: 'active' },
      data: { views: { increment: 1 } },
    })
    if (res.count === 0) {
      return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
    }
    const row = await db.listing.findUnique({
      where: { id },
      select: { views: true },
    })
    return Response.json({ ok: true, views: row?.views ?? 0 })
  } catch {
    return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
  }
}
