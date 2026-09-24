import { parseSearchQuery } from "@/lib/ai"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { mergeNl, nlHasStructure, parseNlQuery, type NlFilters } from "@/lib/nl-search"

/**
 * AI-powered natural-language search parser.
 * POST a Georgian real estate query ("3-bedroom apartment in Vake under $200K")
 * and get back structured filters.
 *
 * Falls back to regex parse when AI is unavailable.
 * ponytail: skip Gemini when regex already structured — AI bill only for leftovers.
 */

export const maxDuration = 15

function fromAi(ai: {
  dealType?: "sale" | "rent" | "daily"
  propertyType?: "apartment" | "house" | "commercial" | "land"
  city?: string
  district?: string
  minPrice?: number
  maxPrice?: number
  rooms?: number
  minArea?: number
  maxArea?: number
  keywords?: string
  parking?: boolean
  bright?: boolean
}): NlFilters {
  const features: string[] = []
  if (ai.parking) features.push("add.f.parking")
  if (ai.bright) features.push("add.f.bright")
  return {
    dealType: ai.dealType,
    propertyType: ai.propertyType,
    city: ai.city,
    district: ai.district,
    minPrice: ai.minPrice,
    maxPrice: ai.maxPrice,
    rooms: ai.rooms,
    minArea: ai.minArea,
    maxArea: ai.maxArea,
    keywords: ai.keywords,
    features: features.length ? features : undefined,
  }
}

export async function POST(req: Request) {
  const limit = rateLimit(`ai-search:${clientIp(req.headers)}`, { windowMs: 5 * 60_000, max: 20 })
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

  const fallback = parseNlQuery(query.trim())
  // Regex covers the common Georgian/EN patterns — don't burn Gemini tokens.
  if (nlHasStructure(fallback)) {
    return Response.json({ ok: true, filters: fallback, source: "fallback" })
  }

  const aiResult = await parseSearchQuery(query.trim())
  if (aiResult) {
    return Response.json({
      ok: true,
      filters: mergeNl(fallback, fromAi(aiResult)),
      source: "ai",
    })
  }

  return Response.json({ ok: true, filters: fallback, source: "fallback" })
}
