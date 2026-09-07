import { generateListingDescription } from "@/lib/ai"

/** Gemini listing-description writer. 10 writes per 5 min per IP — free-tier lock.
 *  No key → { ok:false, error:"ai_unavailable" }; the client falls back to its
 *  offline template, so the seller is never blocked. */
export const maxDuration = 15

const WINDOW_MS = 5 * 60 * 1000
const MAX_PER_WINDOW = 10
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

const s = (v: unknown, max: number): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined

const n = (v: unknown, max: number): number | undefined => {
  const num = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN
  return Number.isFinite(num) && num > 0 && num <= max ? num : undefined
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
