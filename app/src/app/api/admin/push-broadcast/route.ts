import { logAdminAction } from "@/lib/admin/audit"
import { requireAdminAction } from "@/lib/admin/guard"
import { sendPushToAll } from "@/lib/push"

/**
 * POST /api/admin/push-broadcast
 * Admin-only: pushes a web notification to every active subscription.
 * Body: { title, body?, url? } — url must be an in-app path ("/...").
 */
export async function POST(req: Request) {
  let session
  try {
    session = await requireAdminAction()
  } catch {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: "bad_json" }, { status: 400 })
  }

  const b = body as { title?: unknown; body?: unknown; url?: unknown }
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 120) : ""
  const text = typeof b.body === "string" ? b.body.trim().slice(0, 300) : ""
  const url = typeof b.url === "string" && b.url.startsWith("/") ? b.url : "/"
  if (!title) {
    return Response.json({ ok: false, error: "validation" }, { status: 400 })
  }

  const result = await sendPushToAll({ title, body: text, url })

  await logAdminAction(session, "push.broadcast", "push_subscription", "all", {
    title,
    url,
    ...result,
  })

  return Response.json({ ok: true, ...result })
}
