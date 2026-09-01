/**
 * Public listing numbers (MyHome-style 8-digit IDs).
 * DB rows use `publicId` (autoincrement from 10_000_001).
 * Mock / legacy rows fall back to a stable FNV-1a hash of the string id.
 *
 * Lookup priority (shapes don't overlap after parse):
 *   phone  = 9 digits starting 5
 *   cad    = dotted NAPR, or 9–15 digits starting 0, or 11–15 digits
 *   id     = 7–9 digits, not phone, not leading 0
 */

import { formatPhone } from "@/lib/inquiries/phone"

export const PUBLIC_ID_BASE = 10_000_001

export type LookupKind = "id" | "phone" | "cadastral"

/** Georgian mobile: 5xxxxxxxx (9 digits) after stripping +995 / spaces. */
export function parsePhoneDigits(q: string): string | null {
  let d = q.replace(/\D/g, "")
  if (d.startsWith("995") && d.length === 12) d = d.slice(3)
  if (d.length === 9 && d.startsWith("5")) return d
  return null
}

/** Digits-only query that looks like a listing number — not phone, not cadastral. */
export function parseListingNumber(q: string): number | null {
  if (parsePhoneDigits(q)) return null
  const digits = q.replace(/\D/g, "")
  if (digits.startsWith("0")) return null
  if (digits.length < 7 || digits.length > 9) return null
  const n = Number(digits)
  return Number.isFinite(n) && n >= 1_000_000 ? n : null
}

/**
 * Georgian NAPR cadastral: `01.10.01.001.001` (dots optional).
 * Rejects phone so 5xxxxxxxx stays a mobile lookup.
 */
export function parseCadastralCode(q: string): string | null {
  const raw = q.trim()
  if (!raw || parsePhoneDigits(raw)) return null
  if (/^\d{2}(\.\d{2,3}){3,5}$/.test(raw)) return raw
  const digits = raw.replace(/\D/g, "")
  if (digits.length >= 9 && digits.length <= 15 && digits.startsWith("0")) return digits
  if (digits.length >= 11 && digits.length <= 15) return digits
  return null
}

/** Storage variants for JSON `extendedFields.cadastral` equality match. */
export function cadastralVariants(q: string): string[] {
  const parsed = parseCadastralCode(q)
  if (!parsed) return []
  const digits = parsed.replace(/\D/g, "")
  const out = new Set<string>([parsed, digits])
  if (digits.length === 9) {
    out.add(`${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 9)}`)
  }
  if (digits.length === 12) {
    out.add(
      `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 9)}.${digits.slice(9, 12)}`,
    )
  }
  return [...out]
}

/** listingPhone / agent.phone needles — stored as `+995 XXX XX XX XX` or raw digits. */
export function phoneSearchNeedles(q: string): string[] {
  const d = parsePhoneDigits(q)
  if (!d) return []
  const canon = formatPhone(d)
  const local = canon.replace(/^\+995\s/, "")
  return [...new Set([d, canon, local])]
}

export function lookupKind(q: string): LookupKind | null {
  const t = q.trim()
  if (parsePhoneDigits(t)) return "phone"
  if (parseCadastralCode(t)) return "cadastral"
  if (parseListingNumber(t)) return "id"
  return null
}

/** ID / phone / cadastral — skip Meili, hit DB exact path. */
export function isExactLookupQuery(q: string): boolean {
  return lookupKind(q) !== null
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
