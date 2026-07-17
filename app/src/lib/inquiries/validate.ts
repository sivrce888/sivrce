/**
 * POST /api/inquiries payload validation.
 *
 * ponytail: zod is not in the dependency tree and adding deps is out of scope —
 * this is the equivalent hand-rolled validator at the trust boundary. Upgrade
 * path: swap internals for a zod schema, keep the same return contract.
 */

import { normalizePhone } from './phone'

export const INQUIRY_TARGET_TYPES = ['listing', 'project', 'developer', 'agent'] as const
export type InquiryTargetType = (typeof INQUIRY_TARGET_TYPES)[number]

export interface ValidInquiry {
  targetType: InquiryTargetType
  targetId: string
  name: string
  /** Canonical `+995 XXX XX XX XX` */
  phone: string
  message: string
}

export type InquiryFieldErrors = Partial<
  Record<'targetType' | 'targetId' | 'name' | 'phone' | 'message', 'required' | 'invalid'>
>

/** Honeypot check — any non-empty `website` value marks a bot. */
export function hasHoneypot(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false
  const website = (raw as Record<string, unknown>).website
  return typeof website === 'string' && website.trim().length > 0
}

export function validateInquiry(
  raw: unknown,
): { ok: true; data: ValidInquiry } | { ok: false; fields: InquiryFieldErrors } {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const fields: InquiryFieldErrors = {}

  const targetType = typeof obj.targetType === 'string' ? obj.targetType : ''
  if (!(INQUIRY_TARGET_TYPES as readonly string[]).includes(targetType)) fields.targetType = 'invalid'

  const targetId = typeof obj.targetId === 'string' ? obj.targetId.trim() : ''
  if (targetId.length < 1 || targetId.length > 120) fields.targetId = 'invalid'

  const name = typeof obj.name === 'string' ? obj.name.trim().replace(/\s+/g, ' ') : ''
  if (name.length < 2 || name.length > 80) fields.name = 'invalid'

  const phone = normalizePhone(typeof obj.phone === 'string' ? obj.phone : '')
  if (!phone) fields.phone = 'invalid'

  const message = typeof obj.message === 'string' ? obj.message.trim() : ''
  if (message.length < 10 || message.length > 1000) fields.message = 'invalid'

  if (Object.keys(fields).length > 0) return { ok: false, fields }
  return {
    ok: true,
    data: { targetType: targetType as InquiryTargetType, targetId, name, phone: phone as string, message },
  }
}
