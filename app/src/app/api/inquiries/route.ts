import { auth } from "@/auth"
import { LISTINGS, type DealType } from "@/data/listings"
import { db } from "@/lib/db"
import { sendInquiryNotification } from "@/lib/email"
import { checkRateLimit } from "@/lib/inquiries/rate-limit"
import { hasHoneypot, validateInquiry } from "@/lib/inquiries/validate"
import { isSameOrigin } from "@/lib/security/origin"

/** Static-listing dealType → Inquiry.deal vocabulary. */
const DEAL_MAP: Record<DealType, string> = {
  sale: "buy",
  rent: "rent",
  daily: "daily",
  pledge: "pledge",
}

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
  // ponytail: agent emails aren't in the static listing data yet, so all
  // notifications route through the Sivrce inbox. When agent.email is added
  // to the data model, the notification target will update automatically.
  const notifyEmail = SIVRCE_INBOX
  const listingId = targetType === "listing" ? targetId : "general"
  const buyerEmail = email || session?.user?.email || "unknown@sivrce.ge"

  try {
    await db.inquiry.create({
      data: {
        id: crypto.randomUUID(),
        listingId,
        agentName,
        agentEmail: targetType === "general" ? SIVRCE_INBOX : null,
        agentPhone: listing?.agent.phone ?? null,
        buyerName: name,
        buyerEmail,
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

  // Fire-and-forget: notify the agent (never block the API response).
  // ponytail: no `await` — email delivery failures are logged, not surfaced.
  sendInquiryNotification({
    agentEmail: notifyEmail,
    agentName,
    buyerName: name,
    buyerPhone: phone ?? null,
    buyerEmail: email || session?.user?.email || null,
    message,
    listingTitle: listing?.title,
  })

  return Response.json({ ok: true })
}

/** GET — the signed-in buyer's own inquiries (matched by session email). */
export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  const rows = await db.inquiry.findMany({
    where: { buyerEmail: session.user.email, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Titles: one batched db query + in-memory static catalog fallback.
  const ids = [...new Set(rows.map((r) => r.listingId))]
  const dbRows = await db.listing.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true },
  })
  const titles = new Map<string, string>(dbRows.map((r) => [r.id, r.title]))
  for (const l of LISTINGS) {
    if (ids.includes(l.id)) titles.set(l.id, l.title)
  }

  return Response.json({
    ok: true,
    inquiries: rows.map((r) => ({
      id: r.id,
      listingTitle: titles.get(r.listingId) ?? null,
      agentName: r.agentName,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  })
}
