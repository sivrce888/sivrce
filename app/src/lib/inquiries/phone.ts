/**
 * Georgian phone helpers for lead capture — mirrors the add-listing wizard
 * (`src/components/add-listing/AddListingClient.tsx`). Pure, client+server safe.
 */

/** Canonical display form: `+995 XXX XX XX XX` */
export const PHONE_RE = /^\+995 \d{3} \d{2} \d{2} \d{2}$/

/** Normalize any raw input to `+995 XXX XX XX XX` (9 digits after the forced prefix). */
export function formatPhone(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('995')) d = d.slice(3)
  d = d.slice(0, 9)
  const groups = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return `+995${groups.length ? ` ${groups.join(' ')}` : ''}`
}

/** Canonical phone string, or null when the input is not a valid Georgian number. */
export function normalizePhone(raw: string): string | null {
  const formatted = formatPhone(raw)
  return PHONE_RE.test(formatted) ? formatted : null
}

/** Digits-only form for `tel:` links (`+995555123456`). */
export function telHref(phone: string): string {
  return `tel:+${phone.replace(/\D/g, '')}`
}
