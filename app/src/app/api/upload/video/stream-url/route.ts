/**
 * Stream upload ticket: browser uploads bytes straight to Cloudflare.
 * ponytail: Vercel never sees the bytes (60s/RAM). 503 → client uses R2 path.
 */

import { auth } from "@/auth"
import { rateLimitOk } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/security/origin"
import { createDirectUpload } from "@/lib/stream"
import { streamEmbedUrl } from "@/lib/listing-video"

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  if (!rateLimitOk(`upload-video-stream:${session.user.id}`, { max: 8 })) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 })
  }

  try {
    const { uploadURL, uid } = await createDirectUpload()
    return Response.json(
      { ok: true, uploadURL, uid, embedUrl: streamEmbedUrl(uid) },
      { status: 200 },
    )
  } catch (err) {
    const e = err as { message?: string }
    if (e?.message === "stream_disabled") {
      return Response.json({ ok: false, error: "stream_disabled" }, { status: 503 })
    }
    console.error("[api/upload/video/stream-url] ticket failed:", e?.message)
    return Response.json({ ok: false, error: "upload_failed" }, { status: 500 })
  }
}
