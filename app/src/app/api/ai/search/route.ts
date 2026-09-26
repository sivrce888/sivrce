import { answerSupportQuestion, parseSearchQuery } from "@/lib/ai"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { mergeNl, nlHasStructure, parseNlQuery, type NlFilters } from "@/lib/nl-search"
import { isValidLang } from "@/lib/i18n/core"

/**
 * AI text-understanding endpoint, two POST modes:
 * - {query}     → natural-language search: structured filters. Regex covers the
 *                 common Georgian/EN patterns; Gemini handles the leftovers and
 *                 the regex result is the fallback when AI is down.
 * - {question,  → in-chat help assistant: answered strictly from the /faq
 *   lang}         dataset; answer:null = not covered or AI unavailable, and the
 *                 client falls back to did-you-mean + support handoff.
 *
 * Public (guests use both), so IP rate-limited; the bucket is shared on
 * purpose — it caps total free-tier AI spend per visitor.
 *
 * ponytail: one file for both modes because the repo-weight lock (5101 files)
 * leaves no slot for a second route; split into /api/ai/ask when a file is
 * traded out.
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

  const { query, question, lang } = (body as Record<string, unknown>) ?? {}

  // Help-assistant mode: {question, lang} → answer from the /faq dataset.
  if (question !== undefined) {
    if (typeof question !== "string" || question.trim().length === 0) {
      return Response.json({ ok: false, error: "question_required" }, { status: 400 })
    }
    if (question.length > 500) {
      return Response.json({ ok: false, error: "question_too_long" }, { status: 400 })
    }
    if (typeof lang !== "string" || !isValidLang(lang)) {
      return Response.json({ ok: false, error: "bad_lang" }, { status: 400 })
    }
    const answer = await answerSupportQuestion(question.trim(), lang)
    return Response.json({ ok: true, answer })
  }

  // NL search mode: {query} → structured filters.
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
