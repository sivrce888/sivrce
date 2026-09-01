/**
 * Listing video upload → R2 as-is (mp4/webm/mov). Auth + same-origin + size cap.
 * ponytail: no ffmpeg. Transcode when phone bitrates blow mobile data.
 */

import { auth } from "@/auth"
import {
  VIDEO_MAX_BYTES,
  VIDEO_MIME,
  extForVideoMime,
  looksLikeVideoBytes,
  mimeOfVideoFile,
} from "@/lib/listing-video"
import { isSameOrigin } from "@/lib/security/origin"
import { uploadFile } from "@/lib/storage"

export const maxDuration = 60

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 8

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (bucket.count >= MAX_PER_WINDOW) return false
  bucket.count += 1
  return true
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  if (!checkRateLimit(`upload-video:${session.user.id}`)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ ok: false, error: "bad_formdata" }, { status: 400 })
  }

  const file = form.get("file")
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "missing_file" }, { status: 400 })
  }

  const mime = mimeOfVideoFile(file)
  if (!VIDEO_MIME.has(mime)) {
    return Response.json({ ok: false, error: "invalid_file_type" }, { status: 400 })
  }

  if (file.size > VIDEO_MAX_BYTES) {
    return Response.json({ ok: false, error: "file_too_large" }, { status: 400 })
  }

  const buf = new Uint8Array(await file.arrayBuffer())
  if (!looksLikeVideoBytes(buf)) {
    return Response.json({ ok: false, error: "invalid_file_type" }, { status: 400 })
  }

  const now = new Date()
  const prefix = [
    "uploads",
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
  ].join("/")
  const key = `${prefix}/${crypto.randomUUID()}.${extForVideoMime(mime)}`

  try {
    const result = await uploadFile({ key, body: Buffer.from(buf), contentType: mime })
    return Response.json({ ok: true, url: result.url, key }, { status: 201 })
  } catch (err) {
    const e = err as { message?: string }
    console.error("[api/upload/video] upload failed:", e?.message)
    return Response.json({ ok: false, error: "upload_failed" }, { status: 500 })
  }
}
