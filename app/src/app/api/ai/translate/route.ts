import { translateText } from "@/lib/ai"

/** Per-IP rate limiter: 30 translations per 5 minutes. */
const WINDOW_MS = 5 * 60 * 1000
const MAX_PER_WINDOW = 30
const buckets = new Map<string, { count: number; resetAt: number }>()
let lastSweep = 0

function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return
  lastSweep = now
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key)
  }
}

function checkRateLimit(key: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now()
  sweep(now)
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, retryAfterSec: 0 }
  }
  if (b.count >= MAX_PER_WINDOW) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
  }
  b.count += 1
  return { ok: true, retryAfterSec: 0 }
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

export async function POST(req: Request) {
  const limit = checkRateLimit(clientIp(req))
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
