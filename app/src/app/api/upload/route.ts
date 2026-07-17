/**
 * File upload endpoint: accepts image files and stores them in R2.
 *
 * Auth-gated (requires session), rate-limited, same-origin only.
 * Allowed types: jpg, png, webp, avif. Max 10 MB.
 */

import { auth } from "@/auth"
import { isSameOrigin } from "@/lib/security/origin"
import { uploadFile } from "@/lib/storage"

/* ------------------------------------------------------------------ */
/*  Rate limiter (in-memory, per-user)                                */
/* ------------------------------------------------------------------ */

const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_PER_WINDOW = 10

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let lastSweep = 0

function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (bucket.count >= MAX_PER_WINDOW) return false
  bucket.count += 1
  return true
}

/* ------------------------------------------------------------------ */
/*  Validation                                                        */
/* ------------------------------------------------------------------ */

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
])

const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
}

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

/* ------------------------------------------------------------------ */
/*  POST /api/upload                                                  */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json({ ok: false, error: "bad_origin" }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  if (!checkRateLimit(`upload:${session.user.id}`)) {
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

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ ok: false, error: "invalid_file_type" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ ok: false, error: "file_too_large" }, { status: 400 })
  }

  const ext = EXT_MAP[file.type] ?? ".bin"
  const now = new Date()
  const prefix = [
    "uploads",
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
  ].join("/")
  const key = `${prefix}/${crypto.randomUUID()}${ext}`

  try {
    const body = Buffer.from(await file.arrayBuffer())
    const result = await uploadFile({ key, body, contentType: file.type })
    return Response.json({ ok: true, url: result.url, key }, { status: 201 })
  } catch (err) {
    const e = err as { message?: string }
    console.error("[api/upload] upload failed:", e?.message)
    return Response.json({ ok: false, error: "upload_failed" }, { status: 500 })
  }
}
