import { generateListingDescription } from "@/lib/ai"
import { clientIp, rateLimit } from "@/lib/rate-limit"

/** Gemini listing-description writer. 10 writes per 5 min per IP — free-tier lock.
 *  No key → { ok:false, error:"ai_unavailable" }; the client falls back to its
 *  offline template, so the seller is never blocked. */
export const maxDuration = 15

const s = (v: unknown, max: number): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined

const n = (v: unknown, max: number): number | undefined => {
  const num = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN
  return Number.isFinite(num) && num > 0 && num <= max ? num : undefined
}

export async function POST(req: Request) {
  const limit = rateLimit(`ai-describe:${clientIp(req.headers)}`, { windowMs: 5 * 60_000, max: 10 })
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

  const b = (body ?? {}) as Record<string, unknown>
  const propType = s(b.propType, 40)
  const city = s(b.city, 80)
  const rooms = n(b.rooms, 50)
  const area = n(b.area, 100000)
  if (!propType || !city || !rooms || !area) {
    return Response.json({ ok: false, error: "fields_required" }, { status: 400 })
  }

  const rawFeatures = Array.isArray(b.features) ? b.features : []
  const features = rawFeatures
    .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
    .slice(0, 20)
    .map((f) => f.trim().slice(0, 40))

  const description = await generateListingDescription({
    title: s(b.title, 200) ?? "",
    propType,
    dealType: s(b.dealType, 40) ?? "sale",
    city,
    district: s(b.district, 80) ?? "",
    address: s(b.address, 200) ?? "",
    rooms,
    area,
    floor: n(b.floor, 200),
    totalFloors: n(b.totalFloors, 200),
    features: features.length ? features : undefined,
  })

  if (description === null) {
    return Response.json({ ok: false, error: "ai_unavailable" })
  }
  return Response.json({ ok: true, description })
}
