import { translateText } from "@/lib/ai"
import { clientIp, rateLimit } from "@/lib/rate-limit"

/** Per-IP rate limiter: 15 translations per 5 minutes — Gemini cost lock. */
export const maxDuration = 15

export async function POST(req: Request) {
  const limit = rateLimit(`ai-translate:${clientIp(req.headers)}`, { windowMs: 5 * 60_000, max: 15 })
  if (!limit.ok) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: "bad_json" }, { status: 400 })
  }

  const { text, targetLang } = (body as Record<string, unknown>) ?? {}

  if (typeof text !== "string" || text.trim().length === 0) {
    return Response.json({ ok: false, error: "text_required" }, { status: 400 })
  }
  if (text.length > 5000) {
    return Response.json({ ok: false, error: "text_too_long" }, { status: 400 })
  }
  if (!["ka", "en", "ru"].includes(targetLang as string)) {
    return Response.json({ ok: false, error: "invalid_lang" }, { status: 400 })
  }

  const translated = await translateText(text.trim(), targetLang as "ka" | "en" | "ru")

  // ponytail: no AI key → fall back to echoing the input.
  if (translated === null) {
    return Response.json({
      ok: true,
      translated: text.trim(),
      fallback: true,
    })
  }

  return Response.json({ ok: true, translated })
}
