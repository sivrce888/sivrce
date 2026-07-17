import { auth } from "@/auth"
import { LISTINGS } from "@/data/listings"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/inquiries/rate-limit"
import { hasHoneypot, validateInquiry } from "@/lib/inquiries/validate"
import { isSameOrigin } from "@/lib/security/origin"

/** Static-listing dealType → Inquiry.deal vocabulary. */
const DEAL_MAP = { sale: "buy", rent: "rent", daily: "daily" } as const

/** Where brand-level (contact form, no entity) leads are routed. */
const SIVRCE_INBOX = "info@sivrce.ge"

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
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

  // Honeypot: bots get a convincing success, nothing touches the DB.
  if (hasHoneypot(body)) return Response.json({ ok: true })

  const parsed = validateInquiry(body)
  if (!parsed.ok) {
    return Response.json({ ok: false, error: "validation", fields: parsed.fields }, { status: 400 })
  }
  const { targetType, targetId, name, phone, email, message } = parsed.data

  // Session is optional — an auth hiccup must never lose a lead.
  const session = await auth().catch(() => null)

  // Enrich known static listings (agent + geo) so the CRM row is self-contained.
  const listing = targetType === "listing" ? LISTINGS.find((l) => l.id === targetId) : undefined
  const agentName = listing?.agent.name ?? "Sivrce"

  try {
    await db.inquiry.create({
      data: {
        id: crypto.randomUUID(),
        targetType,
        targetId,
        listingId: targetType === "listing" ? targetId : null,
        agentName,
        agentEmail: targetType === "general" ? SIVRCE_INBOX : null,
        agentPhone: listing?.agent.phone ?? null,
        buyerName: name,
        buyerEmail: email || session?.user?.email || null,
        buyerPhone: phone || null,
        message,
        deal: listing ? DEAL_MAP[listing.dealType] : "buy",
        city: listing?.city ?? "",
        district: listing?.district ?? "",
        price: listing?.priceGEL ?? 0,
      },
    })
  } catch (error) {
    // ponytail: log only message/code — never the raw Prisma error (can leak
    // connection-string fragments in some failure modes).
    const e = error as { message?: string; code?: string }
    console.error("[api/inquiries] create failed", e?.code, e?.message)
    return Response.json({ ok: false, error: "server" }, { status: 500 })
  }

  return Response.json({ ok: true })
}
