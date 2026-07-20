/**
 * Public listing numbers (MyHome-style 8-digit IDs).
 * DB rows use `publicId` (autoincrement from 10_000_001).
 * Mock / legacy rows fall back to a stable FNV-1a hash of the string id.
 */

export const PUBLIC_ID_BASE = 10_000_001

/** Digits-only query that looks like a listing number or phone. */
export function parseListingNumber(q: string): number | null {
  const digits = q.replace(/\D/g, "")
  if (digits.length < 7 || digits.length > 9) return null
  const n = Number(digits)
  return Number.isFinite(n) && n >= 1_000_000 ? n : null
}

/** Georgian mobile: 5xxxxxxxx (9 digits) after stripping +995 / spaces. */
export function parsePhoneDigits(q: string): string | null {
  let d = q.replace(/\D/g, "")
  if (d.startsWith("995") && d.length === 12) d = d.slice(3)
  if (d.length === 9 && d.startsWith("5")) return d
  return null
}

/** Stable 8-digit fallback when DB publicId is missing. */
export function publicIdFromString(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return PUBLIC_ID_BASE + ((h >>> 0) % 89_000_000)
}

export function listingPublicId(l: { id: string; publicId?: number | null }): number {
  return l.publicId && l.publicId >= PUBLIC_ID_BASE ? l.publicId : publicIdFromString(l.id)
}
