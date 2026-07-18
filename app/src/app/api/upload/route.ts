/**
 * File upload endpoint: accepts image files, normalizes them with sharp and
 * stores two objects in R2:
 *   <key>            — master: EXIF-rotated, ≤2560px, WebP q82
 *   <key>.lqip.webp  — 16px blur placeholder (see src/lib/media.ts lqipOf)
 *
 * Auth-gated (requires session), rate-limited, same-origin only.
 * Allowed types: jpg, png, webp, avif. Max 10 MB.
 */

import sharp from "sharp"
import { auth } from "@/auth"
import { isSameOrigin } from "@/lib/security/origin"
import { uploadFile } from "@/lib/storage"

/* ------------------------------------------------------------------ */
/*  Rate limiter (in-memory, per-user)                                */
/* ------------------------------------------------------------------ */

const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
// 16-photo listings upload in parallel + leave room for retries / re-picks.
const MAX_PER_WINDOW = 40

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

  const now = new Date()
  const prefix = [
    "uploads",
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
  ].join("/")
  const key = `${prefix}/${crypto.randomUUID()}.webp`

  try {
    // rotate() applies EXIF orientation (phone photos), cap at 2560px so the
    // next/image optimizer never chews on a 10 MB original, re-encode once.
    const base = sharp(Buffer.from(await file.arrayBuffer())).rotate()
    const master = await base
      .clone()
      .resize({ width: 2560, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
    const lqip = await base
      .clone()
      .resize({ width: 16 })
      .webp({ quality: 30 })
      .toBuffer()

    const result = await uploadFile({ key, body: master, contentType: "image/webp" })
    await uploadFile({ key: key.replace(/\.webp$/, ".lqip.webp"), body: lqip, contentType: "image/webp" })
    return Response.json({ ok: true, url: result.url, key }, { status: 201 })
  } catch (err) {
    const e = err as { message?: string }
    console.error("[api/upload] upload failed:", e?.message)
    return Response.json({ ok: false, error: "upload_failed" }, { status: 500 })
  }
}
