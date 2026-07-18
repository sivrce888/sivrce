import { auth } from "@/auth"
import { db } from "@/lib/db"
import { isSameOrigin } from "@/lib/security/origin"

/**
 * POST /api/push/unsubscribe
 * Removes one PushSubscription (by endpoint) for the signed-in user.
 * Idempotent — unknown endpoints still return ok.
 */
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

  const endpoint = (body as { endpoint?: unknown })?.endpoint
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return Response.json({ ok: false, error: "validation" }, { status: 400 })
  }

  await db.pushSubscription.deleteMany({
    where: { userId: session.user.id, endpoint },
  })

  return Response.json({ ok: true })
}
