'use server'

/**
 * "Report an inaccuracy" on project/developer pages (Korter parity, but the
 * report lands in our own moderation queue): files a Complaint of kind
 * `misinformation` against the public slug. Anonymous allowed — rate-limited
 * per IP, honeypot-gated, and the slug must resolve to a live entity.
 */

import { headers } from 'next/headers'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { ComplaintKind } from '@/generated/prisma/enums'
import { clientIp, rateLimitOk } from '@/lib/rate-limit'
import { getLiveDeveloper, getLiveProject } from '@/lib/directory-live'
import { REPORT_FIELDS } from '@/lib/project-page-copy'

export type ReportState = 'idle' | 'ok' | 'error' | 'limited'

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/

export async function reportInaccuracy(_prev: ReportState, form: FormData): Promise<ReportState> {
  // Bots fill every field; humans never see this one. Pretend success.
  if (String(form.get('website') ?? '')) return 'ok'
  const kind = String(form.get('kind') ?? '')
  const slug = String(form.get('slug') ?? '')
  const field = String(form.get('field') ?? '')
  const details = String(form.get('details') ?? '').trim()
  const email = String(form.get('email') ?? '').trim()
  if (
    (kind !== 'project' && kind !== 'developer') ||
    !slug || slug.length > 140 ||
    !(REPORT_FIELDS as readonly string[]).includes(field) ||
    details.length < 5 || details.length > 1000 ||
    (email !== '' && (email.length > 240 || !EMAIL_RE.test(email)))
  ) {
    return 'error'
  }
  const ip = clientIp(await headers())
  if (!rateLimitOk(`inaccuracy:${ip}`, { max: 5 })) return 'limited'
  const exists = kind === 'project' ? await getLiveProject(slug) : await getLiveDeveloper(slug)
  if (!exists) return 'error'
  const session = await auth().catch(() => null)
  try {
    await db.complaint.create({
      data: {
        subjectKind: kind,
        subjectId: slug,
        reporterId: session?.user?.id ?? null,
        reporterEmail: email || null,
        reporterIp: ip === 'unknown' ? null : ip,
        kind: ComplaintKind.misinformation,
        description: `[${field}] ${details}`,
      },
    })
    return 'ok'
  } catch (error) {
    console.error('[inaccuracy-report] failed:', (error as Error).message)
    return 'error'
  }
}
