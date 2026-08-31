/**
 * Phone-auth identity helpers. Canonical number is `+995 XXX XX XX XX`.
 * Phone-only accounts use a non-deliverable email so User.email stays unique
 * without making the column optional (Auth.js adapter still expects it).
 */
import { formatPhone, normalizePhone } from "@/lib/inquiries/phone"

export const PHONE_EMAIL_DOMAIN = "phone.sivrce.internal"
export const OTP_LEN = 6
export const OTP_TTL_MS = 10 * 60 * 1000

function phoneDigits(phone: string): string {
  let d = phone.replace(/\D/g, "")
  if (d.length === 9) d = `995${d}`
  return d
}

export function phoneEmail(phone: string): string {
  return `p${phoneDigits(phone)}@${PHONE_EMAIL_DOMAIN}`
}

export function isPhoneEmail(email: string | null | undefined): boolean {
  return Boolean(email?.endsWith(`@${PHONE_EMAIL_DOMAIN}`))
}

/** Formatted Georgian number from a synthetic email, else the email itself. */
export function displayFromEmail(email: string | null | undefined): string {
  if (!email) return "—"
  if (!isPhoneEmail(email)) return email
  const at = email.indexOf("@")
  const digits = email.slice(1, at)
  return formatPhone(digits)
}

export function accountLabel(name: string | null | undefined, email: string | null | undefined): string {
  const n = name?.trim()
  if (n) return n
  return displayFromEmail(email)
}

export { normalizePhone, formatPhone }
