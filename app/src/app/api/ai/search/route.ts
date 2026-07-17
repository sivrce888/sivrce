import { parseSearchQuery } from "@/lib/ai"

/**
 * AI-powered natural-language search parser.
 * POST a Georgian real estate query ("3-bedroom apartment in Vake under $200K")
 * and get back structured filters.
 *
 * Falls back to basic keyword matching when AI is unavailable.
 */

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

// ponytail: simple in-memory rate limiter — shared pattern with translate route.
const WINDOW_MS = 5 * 60 * 1000
const MAX_PER_WINDOW = 50
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

/**
 * Basic keyword extraction fallback when AI is unavailable.
 * Extracts simple patterns from Georgian or English text.
 */
function basicParse(query: string) {
  const q = query.toLowerCase().trim()
  const result: Record<string, unknown> = { keywords: query.trim() }

  // Deal type
  if (/იყიდება|sell|sale|buy|შეძენა|გაყიდვა/i.test(q)) result.dealType = "sale"
  else if (/ქირავდება|rent|lease|ქირა|გაქირავება/i.test(q)) result.dealType = "rent"
  else if (/დღიურად|daily|overnight/i.test(q)) result.dealType = "daily"

  // Property type
  if (/ბინა|apartment|flat|studio/i.test(q)) result.propertyType = "apartment"
  else if (/სახლი|house|villa|ვილა|cottage/i.test(q)) result.propertyType = "house"
  else if (/კომერც|commercial|shop|მაღაზია|office|ოფისი/i.test(q)) result.propertyType = "commercial"
  else if (/მიწა|land|plot|ნაკვეთი/i.test(q)) result.propertyType = "land"

  // Rooms
  const roomMatch = q.match(/(\d+)[-\s]?(ოთახიანი|room|bedroom|bed)/i)
  if (roomMatch) result.rooms = parseInt(roomMatch[1]!, 10)

  // Price range
  const priceMatch = q.match(/\$?\s?(\d+)\s?[kK]/)
  if (priceMatch) result.maxPrice = parseInt(priceMatch[1]!, 10) * 1000
  const underMatch = q.match(/under\s+\$?\s?(\d+[\d,]*[kKmM]?)/i)
  if (underMatch) {
    const val = underMatch[1]!.replace(/[,]/g, "")
    if (/[kK]$/.test(val)) result.maxPrice = parseInt(val, 10) * 1000
    else if (/[mM]$/.test(val)) result.maxPrice = parseInt(val, 10) * 1000000
    else result.maxPrice = parseInt(val, 10)
  }

  // City / District (Georgian)
  const geoCities: Record<string, string> = {
    თბილისი: "თბილისი", tbilisi: "თბილისი",
    ბათუმი: "ბათუმი", batumi: "ბათუმი",
    ქუთაისი: "ქუთაისი", kutaisi: "ქუთაისი",
  }
  for (const [key, city] of Object.entries(geoCities)) {
    if (q.includes(key)) { result.city = city; break }
  }

  const geoDistricts: Record<string, string> = {
    ვაკე: "ვაკე", vake: "ვაკე",
    საბურთალო: "საბურთალო", saburtalo: "საბურთალო",
    ისანი: "ისანი", isani: "ისანი",
    გლდანი: "გლდანი", gldani: "გლდანი",
    მთაწმინდა: "მთაწმინდა", mtatsminda: "მთაწმინდა",
    დიღომი: "დიდი დიღომი", dighomi: "დიდი დიღომი",
  }
  for (const [key, district] of Object.entries(geoDistricts)) {
    if (q.includes(key)) { result.district = district; break }
  }

  return result
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

  const { query } = (body as Record<string, unknown>) ?? {}
  if (typeof query !== "string" || query.trim().length === 0) {
    return Response.json({ ok: false, error: "query_required" }, { status: 400 })
  }
  if (query.length > 500) {
    return Response.json({ ok: false, error: "query_too_long" }, { status: 400 })
  }

  // Try AI first, fall back to basic parsing.
  const aiResult = await parseSearchQuery(query.trim())
  if (aiResult) {
    return Response.json({ ok: true, filters: aiResult, source: "ai" })
  }

  const fallback = basicParse(query.trim())
  return Response.json({ ok: true, filters: fallback, source: "fallback" })
}
