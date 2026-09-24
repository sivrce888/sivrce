/**
 * Stream encode status for the add-listing poller. Same-origin + auth.
 * ponytail: uid shape checked before touching the Stream API (no SSRF surface).
 */

import { auth } from "@/auth"
import { rateLimitOk } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"
import { streamState } from "@/lib/stream"
import { streamEmbedUrl } from "@/lib/listing-video"

const UID = /^[0-9a-f]{32}$/i

export async function GET(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  // Poller hits this every few seconds while Stream encodes.
  if (!rateLimitOk(`upload-video-status:${session.user.id}`, { max: 120 })) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 })
  }

  const uid = new URL(req.url).searchParams.get("uid") ?? ""
  if (!UID.test(uid)) {
    return Response.json({ ok: false, error: "bad_uid" }, { status: 400 })
  }

  try {
    const st = await streamState(uid.toLowerCase())
    if (st.error) {
      return Response.json({ ok: false, error: "stream_error" }, { status: 422 })
    }
    return Response.json(
      {
        ok: true,
        ready: st.ready,
        ...(st.ready ? { embedUrl: streamEmbedUrl(uid.toLowerCase()) } : {}),
        ...(typeof st.duration === "number" ? { duration: st.duration } : {}),
      },
      { status: 200 },
    )
  } catch (err) {
    const e = err as { message?: string }
    if (e?.message === "stream_disabled") {
      return Response.json({ ok: false, error: "stream_disabled" }, { status: 503 })
    }
    return Response.json({ ok: false, error: "upload_failed" }, { status: 500 })
  }
}
