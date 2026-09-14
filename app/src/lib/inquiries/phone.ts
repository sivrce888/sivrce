/**
 * Georgian phone helpers for lead capture — mirrors the add-listing wizard
 * (`src/components/add-listing/AddListingClient.tsx`). Pure, client+server safe.
 */

/** Canonical display form: `+995 XXX XX XX XX` */
export const PHONE_RE = /^\+995 \d{3} \d{2} \d{2} \d{2}$/

/** German E.161-style: +49 Vorwahl (2–5) Teilnehmer (3–9). */
export const PHONE_RE_DE = /^\+49 \d{2,5} \d{3,9}$/

/** Site switchboard — site-level contact surfaces + last-resort fallback for numberless (dev) listings. */
export const CONTACT_PHONE = '+995 500 333 111'

function looksGerman(raw: string, digits: string): boolean {
  const t = raw.trim()
  if (t.startsWith('+49') || t.startsWith('0049')) return true
  return digits.startsWith('49') && digits.length >= 10 && !digits.startsWith('995')
}

function formatDe(digits: string): string {
  let d = digits
  if (d.startsWith('0049')) d = d.slice(4)
  else if (d.startsWith('49')) d = d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  d = d.slice(0, 11)
  if (!d) return '+49'
  const areaLen = /^(30|40|69|89)\d/.test(d) ? 2 : Math.min(3, d.length)
  const area = d.slice(0, areaLen)
  const rest = d.slice(areaLen)
  return rest ? `+49 ${area} ${rest}` : `+49 ${area}`
}

/** GE `+995 XXX XX XX XX` or DE `+49 VV NNNNN`. */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (looksGerman(raw, d)) return formatDe(d)
  let local = d.startsWith('995') ? d.slice(3) : d
  local = local.slice(0, 9)
  const groups = [local.slice(0, 3), local.slice(3, 5), local.slice(5, 7), local.slice(7, 9)].filter(Boolean)
  return `+995${groups.length ? ` ${groups.join(' ')}` : ''}`
}

/** Canonical phone string, or null when neither a valid Georgian nor German number. */
export function normalizePhone(raw: string): string | null {
  const formatted = formatPhone(raw)
  return PHONE_RE.test(formatted) || PHONE_RE_DE.test(formatted) ? formatted : null
}

/** Digits-only form for `tel:` links (`+995555123456`). */
export function telHref(phone: string): string {
  return `tel:+${phone.replace(/\D/g, '')}`
}

/** WhatsApp click-to-chat — ss.ge / myhome conversion path, after reveal only. */
export function waHref(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '')
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${q}`
}

/**
 * Public mask for listing pages — scrapers never see the full number in HTML/JS.
 * GE: `555 *** ***`. DE: `+49 30 *** ****`. Too short: `*** *** ***`.
 */
export function maskPhone(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('49') && d.length >= 8 && !d.startsWith('995')) {
    const nsn = d.slice(2).replace(/^0/, '')
    const areaLen = /^(30|40|69|89)/.test(nsn) ? 2 : Math.min(3, nsn.length)
    return `+49 ${nsn.slice(0, areaLen)} *** ****`
  }
  if (d.startsWith('995')) d = d.slice(3)
  if (d.length < 3) return '*** *** ***'
  return `${d.slice(0, 3)} *** ***`
}

/** `extendedFields.phoneReveals` counter — no schema migration. */
export function phoneRevealsOf(extended: unknown): number {
  const n = (extended as { phoneReveals?: unknown } | null)?.phoneReveals
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}
