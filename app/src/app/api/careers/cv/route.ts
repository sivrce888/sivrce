/**
 * Public careers CV upload — PDF / DOC / DOCX → R2 `careers/YYYY/MM/<uuid>.<ext>`.
 * Same-origin + BotID + IP rate limit. No auth (hiring form is anonymous).
 */

import { checkBotId } from 'botid/server'

import { cvContentType, detectCvKind } from '@/lib/careers-cv'
import { checkRateLimit } from '@/lib/inquiries/rate-limit'
import { isSameOrigin } from '@/lib/security/origin'
import { uploadFile } from '@/lib/storage'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json({ ok: false, error: 'bad_origin' }, { status: 403 })
  }

  const verification = await checkBotId()
  if (verification.isBot) {
    return Response.json({ ok: false, error: 'bot_denied' }, { status: 403 })
  }

  const limit = checkRateLimit(`careers-cv:${clientIp(req)}`)
  if (!limit.ok) {
    return Response.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ ok: false, error: 'bad_formdata' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: 'missing_file' }, { status: 400 })
  }

  if (file.size < 5 || file.size > MAX_BYTES) {
    return Response.json({ ok: false, error: 'file_size' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const kind = detectCvKind(buf, file.name)
  if (!kind) {
    return Response.json({ ok: false, error: 'bad_type' }, { status: 400 })
  }

  const now = new Date()
  const prefix = ['careers', String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0')].join('/')
  const key = `${prefix}/${crypto.randomUUID()}.${kind}`

  try {
    const result = await uploadFile({ key, body: buf, contentType: cvContentType(kind) })
    return Response.json({ ok: true, url: result.url, key, kind }, { status: 201 })
  } catch (err) {
    const e = err as { message?: string }
    console.error('[api/careers/cv] upload failed:', e?.message)
    return Response.json({ ok: false, error: 'upload_failed' }, { status: 500 })
  }
}
