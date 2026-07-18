import { auth } from "@/auth"
import { db } from "@/lib/db"
import { isSameOrigin } from "@/lib/security/origin"

/**
 * POST /api/push/subscribe
 * Stores a browser PushSubscription for the signed-in user.
 * Body: PushSubscriptionJSON — { endpoint, keys: { p256dh, auth } }.
 */

const B64URL_RE = /^[A-Za-z0-9_-]+=*$/

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: "bad_json" }, { status: 400 })
  }

  const b = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
  const endpoint = typeof b?.endpoint === "string" ? b.endpoint : ""
  const p256dh = typeof b?.keys?.p256dh === "string" ? b.keys.p256dh : ""
  const authKey = typeof b?.keys?.auth === "string" ? b.keys.auth : ""

  const valid =
    endpoint.startsWith("https://") &&
    endpoint.length <= 2000 &&
    B64URL_RE.test(p256dh) &&
    p256dh.length <= 255 &&
    B64URL_RE.test(authKey) &&
    authKey.length <= 255
  if (!valid) {
    return Response.json({ ok: false, error: "validation" }, { status: 400 })
  }

  await db.pushSubscription.upsert({
    where: { userId_endpoint: { userId: session.user.id, endpoint } },
    create: { userId: session.user.id, endpoint, p256dh, auth: authKey },
    update: { p256dh, auth: authKey, isActive: true },
  })

  return Response.json({ ok: true })
}
