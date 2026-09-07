/**
 * First-touch acquisition attribution.
 *
 * The edge proxy stamps the first landing source into the `sv_ref` cookie
 * (30-day window); auth stamps it onto the user row at sign-in, once, never
 * overwritten. Priority: ?utm_source > ?ref > Referer hostname > "direct".
 */

export const REF_COOKIE = "sv_ref"
export const REF_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

/** Lowercase, keep hostname-ish chars, strip www., cap length; empty → "direct". */
export function normalizeSource(raw: string | null | undefined): string {
  const s = (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 60)
  return s || "direct"
}
