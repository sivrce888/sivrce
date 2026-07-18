/**
 * POST /api/listings/[id]/phone — reveal agent phone after BotID + rate limit.
 * Full number never ships in SSR/HTML; only this gated endpoint returns it.
 */
import { checkBotId } from 'botid/server'

import { checkRateLimit } from '@/lib/inquiries/rate-limit'
import { maskPhone, telHref } from '@/lib/inquiries/phone'
import { bumpPhoneReveals, resolveListingPhone } from '@/lib/listings/phone-vault'
import { isSameOrigin } from '@/lib/security/origin'

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(req)) {
    return Response.json({ ok: false, error: 'bad_origin' }, { status: 403 })
  }

  const verification = await checkBotId()
  if (verification.isBot) {
    return Response.json({ ok: false, error: 'bot_denied' }, { status: 403 })
  }

  const limit = checkRateLimit(`phone:${clientIp(req)}`)
  if (!limit.ok) {
    return Response.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    )
  }

  const { id } = await ctx.params
  if (!id || id.length > 120) {
    return Response.json({ ok: false, error: 'bad_id' }, { status: 400 })
  }

  const phone = await resolveListingPhone(id)
  if (!phone) {
    return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
  }

  // Fire-and-forget analytics — never block the reveal.
  void bumpPhoneReveals(id)

  return Response.json({
    ok: true,
    phone,
    tel: telHref(phone),
    masked: maskPhone(phone),
  })
}
